"""Local Smart Chomka commerce server. Run: python server.py --port 8766."""
import argparse
import hashlib
import hmac
import json
import os
import re
import secrets
import sqlite3
import time
import sys
from customer_accounts import CustomerMixin, initialize_customers
sys.modules.setdefault("server", sys.modules[__name__])
from contextlib import contextmanager
from http.cookies import SimpleCookie
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit

BASE = Path(__file__).resolve().parent
WEB = BASE.parent / 'smart-chomka-pwa-preview-v65'
DB = Path(os.environ.get('SMART_CHOMKA_DB', str(BASE / 'data' / 'commerce.sqlite3')))
SESSIONS = {}
ATTEMPTS = {}

@contextmanager
def connect():
    db = sqlite3.connect(DB, timeout=15)
    db.row_factory = sqlite3.Row
    db.execute('PRAGMA foreign_keys=ON')
    try:
        with db:
            yield db
    finally:
        db.close()

def initialize():
    DB.parent.mkdir(parents=True, exist_ok=True)
    with connect() as db:
        db.executescript('''
        PRAGMA journal_mode=WAL;
        CREATE TABLE IF NOT EXISTS admins (username TEXT PRIMARY KEY, salt TEXT NOT NULL, password_hash TEXT NOT NULL);
        CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY,value TEXT NOT NULL);
        CREATE TABLE IF NOT EXISTS products (
          id TEXT PRIMARY KEY, name TEXT NOT NULL, category TEXT NOT NULL, supplier TEXT NOT NULL DEFAULT '',
          description TEXT NOT NULL DEFAULT '', image TEXT NOT NULL DEFAULT '', unit TEXT NOT NULL DEFAULT 'item',
          price_cents INTEGER, stock INTEGER NOT NULL DEFAULT 0 CHECK(stock >= 0),
          active INTEGER NOT NULL DEFAULT 0, version INTEGER NOT NULL DEFAULT 1, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
        CREATE TABLE IF NOT EXISTS orders (
          id TEXT PRIMARY KEY, token TEXT UNIQUE NOT NULL, request_key TEXT UNIQUE NOT NULL, payload_hash TEXT NOT NULL,
          customer TEXT NOT NULL, phone TEXT NOT NULL, address TEXT NOT NULL, note TEXT NOT NULL,
          payment_method TEXT NOT NULL DEFAULT 'cash_on_delivery', payment_status TEXT NOT NULL DEFAULT 'unpaid', status TEXT NOT NULL DEFAULT 'pending',
          total_cents INTEGER NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
        CREATE TABLE IF NOT EXISTS order_items (
          order_id TEXT NOT NULL REFERENCES orders(id), product_id TEXT NOT NULL REFERENCES products(id),
          name TEXT NOT NULL, unit TEXT NOT NULL, quantity INTEGER NOT NULL, price_cents INTEGER NOT NULL,
          PRIMARY KEY(order_id,product_id));
        CREATE TABLE IF NOT EXISTS stock_movements (
          id INTEGER PRIMARY KEY AUTOINCREMENT, product_id TEXT NOT NULL REFERENCES products(id),
          delta INTEGER NOT NULL, reason TEXT NOT NULL, actor TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
        ''')
        initialize_customers(db)
        seed = BASE / 'catalog-seed.json'
        if seed.exists():
            for item in json.loads(seed.read_text(encoding='utf-8')):
                db.execute('INSERT OR IGNORE INTO products(id,name,category,supplier,description,image,unit) VALUES(?,?,?,?,?,?,?)',
                           (item['id'], item['name'], item['category'], item['supplier'], item.get('formula') or '', item.get('image') or '', item.get('pack') or 'item'))

def password_hash(password, salt):
    return hashlib.scrypt(password.encode(), salt=bytes.fromhex(salt), n=16384, r=8, p=1).hex()

def clean(value, label, limit=200, required=True):
    if not isinstance(value, str) or len(value) > limit or (required and not value.strip()):
        raise ValueError(f'Invalid {label}')
    return value.strip()

def integer(value, label, minimum=0, maximum=1000000):
    if isinstance(value, bool) or not isinstance(value, int) or not minimum <= value <= maximum:
        raise ValueError(f'Invalid {label}')
    return value

class Handler(CustomerMixin, SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(WEB), **kwargs)

    def log_message(self, fmt, *args):
        # Do not log customer payloads or receipt tokens.
        pass

    def send_json(self, data, status=200, cookie=None):
        body = json.dumps(data, ensure_ascii=False).encode()
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Cache-Control', 'no-store')
        self.send_header('X-Content-Type-Options', 'nosniff')
        self.send_header('Content-Length', str(len(body)))
        if cookie:
            self.send_header('Set-Cookie', cookie)
        self.end_headers()
        self.wfile.write(body)

    def body_json(self):
        if self.headers.get('Content-Type', '').split(';')[0] != 'application/json':
            raise ValueError('JSON required')
        origin = self.headers.get('Origin')
        if origin and urlsplit(origin).netloc != self.headers.get('Host'):
            raise PermissionError('Origin rejected')
        length = int(self.headers.get('Content-Length', '0'))
        if not 0 < length <= (1500000 if urlsplit(self.path).path == '/commerce-api/admin/payments' else 64000):
            raise ValueError('Invalid request size')
        value = json.loads(self.rfile.read(length))
        if not isinstance(value, dict):
            raise ValueError('JSON object required')
        return value

    def admin(self):
        cookie = SimpleCookie()
        cookie.load(self.headers.get('Cookie', ''))
        key = cookie.get('chomka_admin')
        session = SESSIONS.get(key.value if key else '')
        if not session or session['expires'] < time.time():
            raise PermissionError('Admin login required')
        return session['username']

    def do_GET(self):
        path = urlsplit(self.path).path
        try:
            if path.startswith('/commerce-api/customer/'):
                return self.customer_get(path)
            if path == '/commerce-api/setup':
                with connect() as db:
                    return self.send_json({'needs_setup': db.execute('SELECT COUNT(*) FROM admins').fetchone()[0] == 0})
            if path == '/commerce-api/payments':
                with connect() as db:
                    return self.send_json(dict(db.execute('SELECT key,value FROM settings').fetchall()))
            if path == '/commerce-api/products':
                with connect() as db:
                    return self.send_json([dict(row) for row in db.execute('SELECT * FROM products WHERE active=1 ORDER BY updated_at DESC,id')])
            if path == '/commerce-api/admin/data':
                username = self.admin()
                with connect() as db:
                    orders = [dict(row) for row in db.execute('SELECT id,customer,phone,address,note,payment_method,payment_status,status,total_cents,delivery_cents,created_at FROM orders ORDER BY created_at DESC,rowid DESC')]
                    for order in orders:
                        order['items'] = [dict(row) for row in db.execute('SELECT name,unit,quantity,price_cents FROM order_items WHERE order_id=?', (order['id'],))]
                    return self.send_json({'username':username, 'products':[dict(row) for row in db.execute('SELECT * FROM products ORDER BY name')], 'orders':orders,
                                           'customers':[dict(row) for row in db.execute('SELECT id,name,phone,address,created_at FROM customers ORDER BY created_at DESC')], 'movements':[dict(row) for row in db.execute('SELECT m.*,p.name FROM stock_movements m JOIN products p ON p.id=m.product_id ORDER BY m.id DESC LIMIT 200')]})
            if path.startswith('/commerce-api/orders/'):
                order_id = path.rsplit('/',1)[-1]
                with connect() as db:
                    row = db.execute('SELECT id,status,total_cents,delivery_cents,payment_method,payment_status,created_at FROM orders WHERE id=? AND token=?', (order_id,self.headers.get('X-Order-Token',''))).fetchone()
                    if not row:
                        return self.send_json({'error':'Order not found'},404)
                    order = dict(row)
                    order['items'] = [dict(item) for item in db.execute('SELECT name,unit,quantity,price_cents FROM order_items WHERE order_id=?',(order_id,))]
                    return self.send_json(order)
            if path.startswith('/commerce-api/'):
                return self.send_json({'error':'Not found'},404)
            # Explicit static allowlist excludes secrets, API source, archives and databases.
            parts = Path(path).parts
            if any(part.startswith('.') for part in parts) or not (path in ('/','/admin','/admin/') or Path(path).suffix.lower() in {'.html','.js','.css','.json','.webmanifest','.png','.jpg','.jpeg','.webp','.svg','.woff2','.wasm','.mjs','.onnx','.pdf'}):
                return self.send_json({'error':'Not found'},404)
            if path.startswith('/api/') or '..' in parts:
                return self.send_json({'error':'Not found'},404)
            if path in ('/admin','/admin/'):
                self.path = '/admin/index.html'
            super().do_GET()
        except PermissionError as error:
            self.send_json({'error':str(error)},401)

    def list_directory(self, path):
        self.send_error(404)
        return None

    def do_HEAD(self):
        self.send_error(405)

    def do_POST(self):
        path = urlsplit(self.path).path
        try:
            data = self.body_json()
            if path.startswith('/commerce-api/customer/'):
                return self.customer_post(path, data)
            if path in ('/commerce-api/setup','/commerce-api/login'):
                username = clean(data.get('username'), 'username', 80)
                password = clean(data.get('password'), 'password', 256)
                address = self.client_address[0]
                recent = [stamp for stamp in ATTEMPTS.get(address,[]) if stamp > time.time()-300]
                if len(recent) >= 15:
                    return self.send_json({'error':'Too many attempts. Try again in 5 minutes.'},429)
                ATTEMPTS[address] = recent + [time.time()]
                with connect() as db:
                    db.execute('BEGIN IMMEDIATE')
                    if path.endswith('setup'):
                        if db.execute('SELECT COUNT(*) FROM admins').fetchone()[0]:
                            return self.send_json({'error':'Admin already configured'},409)
                        if len(password) < 12:
                            raise ValueError('Use a password of at least 12 characters')
                        salt = secrets.token_hex(16)
                        db.execute('INSERT INTO admins VALUES(?,?,?)',(username,salt,password_hash(password,salt)))
                    else:
                        row = db.execute('SELECT * FROM admins WHERE username=?',(username,)).fetchone()
                        if not row or not hmac.compare_digest(row['password_hash'],password_hash(password,row['salt'])):
                            raise PermissionError('Invalid login')
                token = secrets.token_urlsafe(32)
                SESSIONS[token] = {'username':username,'expires':time.time()+8*3600}
                return self.send_json({'ok':True},cookie=f'chomka_admin={token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=28800')
            if path == '/commerce-api/logout':
                cookie = SimpleCookie(self.headers.get('Cookie',''))
                if cookie.get('chomka_admin'):
                    SESSIONS.pop(cookie['chomka_admin'].value,None)
                return self.send_json({'ok':True},cookie='chomka_admin=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0')
            if path == '/commerce-api/admin/payments':
                self.admin()
                name = clean(data.get('merchant',''),'merchant',120,False)
                qr = clean(data.get('qr',''),'QR image',1400000,False)
                if qr and not re.fullmatch(r'data:image/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+',qr):
                    raise ValueError('Upload a PNG, JPG or WebP merchant QR image')
                if qr and not name:
                    raise ValueError('Merchant name required')
                fee = integer(data.get('delivery_cents',0),'delivery fee',0,1000000)
                with connect() as db:
                    for key,value in [('merchant',name),('qr',qr),('delivery_cents',str(fee))]:
                        db.execute('INSERT OR REPLACE INTO settings VALUES(?,?)',(key,value))
                return self.send_json({'ok':True})
            if path == '/commerce-api/admin/payment-confirm':
                self.admin()
                with connect() as db:
                    cursor = db.execute("UPDATE orders SET payment_status='paid' WHERE id=? AND status!='cancelled'",(data.get('id'),))
                    if not cursor.rowcount:
                        raise ValueError('Order not found or cancelled')
                return self.send_json({'ok':True})
            if path == '/commerce-api/admin/product':
                username = self.admin()
                name = clean(data.get('name'),'name',150)
                category = data.get('category')
                if category not in ('durian','medicine','fertilizer','tools'):
                    raise ValueError('Invalid category')
                price = data.get('price_cents')
                if price is not None:
                    integer(price,'price',1,100000000)
                stock = integer(data.get('stock'),'stock')
                active = data.get('active') is True
                if active and price is None:
                    raise ValueError('Set a price before publishing')
                image = clean(data.get('image',''),'image',2000,False)
                if image and not (image.startswith('https://') or image.startswith('./assets/')):
                    raise ValueError('Use an HTTPS image URL or an app asset')
                values = (name,category,clean(data.get('supplier',''),'supplier',120,False),clean(data.get('description',''),'description',3000,False),image,clean(data.get('unit'),'unit',100),price,stock,int(active))
                with connect() as db:
                    db.execute('BEGIN IMMEDIATE')
                    id = data.get('id')
                    if id:
                        old = db.execute('SELECT * FROM products WHERE id=?',(id,)).fetchone()
                        if not old:
                            return self.send_json({'error':'Product not found'},404)
                        if old['version'] != data.get('version'):
                            return self.send_json({'error':'Product or stock changed. Reload before editing.'},409)
                        db.execute('UPDATE products SET name=?,category=?,supplier=?,description=?,image=?,unit=?,price_cents=?,stock=?,active=?,version=version+1,updated_at=CURRENT_TIMESTAMP WHERE id=?',values+(id,))
                        delta = stock-old['stock']
                    else:
                        id = secrets.token_hex(10)
                        db.execute('INSERT INTO products(name,category,supplier,description,image,unit,price_cents,stock,active,id) VALUES(?,?,?,?,?,?,?,?,?,?)',values+(id,))
                        delta = stock
                    if delta:
                        db.execute('INSERT INTO stock_movements(product_id,delta,reason,actor) VALUES(?,?,?,?)',(id,delta,'Admin stock adjustment',username))
                return self.send_json({'ok':True,'id':id})
            if path == '/commerce-api/orders':
                return self.create_order(data)
            if path == '/commerce-api/admin/order-status':
                username = self.admin()
                next_status = data.get('status')
                with connect() as db:
                    db.execute('BEGIN IMMEDIATE')
                    order = db.execute('SELECT * FROM orders WHERE id=?',(data.get('id'),)).fetchone()
                    if not order:
                        return self.send_json({'error':'Order not found'},404)
                    if next_status == order['status']:
                        return self.send_json({'ok':True})
                    allowed = {'pending':['confirmed','cancelled'],'confirmed':['shipped','fulfilled','cancelled'],'shipped':['fulfilled'],'fulfilled':[],'cancelled':[]}
                    if next_status not in allowed[order['status']]:
                        raise ValueError('Invalid order status transition')
                    if next_status in ('shipped','fulfilled') and order['payment_method']=='khqr' and order['payment_status']!='paid':
                        raise ValueError('Verify KHQR payment before shipping or completing the order')
                    if next_status == 'fulfilled' and order['payment_status']!='paid':
                        raise ValueError('Confirm collected payment before completing the order')
                    if next_status == 'cancelled':
                        for item in db.execute('SELECT * FROM order_items WHERE order_id=?',(order['id'],)).fetchall():
                            db.execute('UPDATE products SET stock=stock+?,version=version+1,updated_at=CURRENT_TIMESTAMP WHERE id=?',(item['quantity'],item['product_id']))
                            db.execute('INSERT INTO stock_movements(product_id,delta,reason,actor) VALUES(?,?,?,?)',(item['product_id'],item['quantity'],'Cancelled '+order['id'],username))
                    db.execute('UPDATE orders SET status=? WHERE id=?',(next_status,order['id']))
                    db.execute('INSERT INTO order_events(order_id,status,actor) VALUES(?,?,?)',(order['id'],next_status,username))
                return self.send_json({'ok':True})
            self.send_json({'error':'Not found'},404)
        except PermissionError as error:
            self.send_json({'error':str(error)},401)
        except (ValueError,TypeError,KeyError) as error:
            self.send_json({'error':str(error)},400)
        except sqlite3.Error:
            self.send_json({'error':'Database operation failed. Please retry.'},503)

    def create_order(self, data):
        account = self.customer()
        customer = clean(data.get('customer'),'customer',120)
        phone = clean(data.get('phone'),'phone',20)
        if not re.fullmatch(r'\+?[0-9 ()-]{7,20}',phone):
            raise ValueError('Invalid phone')
        address = clean(data.get('address'),'delivery address',600)
        note = clean(data.get('note',''),'note',500,False)
        method = data.get('payment_method')
        if method not in ('cash_on_delivery','khqr'):
            raise ValueError('Choose cash on delivery or KHQR')
        key = clean(data.get('request_key'),'request key',100)
        items = data.get('items')
        if not isinstance(items,list) or not 1 <= len(items) <= 50:
            raise ValueError('Cart must contain 1â€“50 items')
        digest = hashlib.sha256(json.dumps({**data,'customer_id':account['id']},sort_keys=True).encode()).hexdigest()
        with connect() as db:
            db.execute('BEGIN IMMEDIATE')
            previous = db.execute('SELECT * FROM orders WHERE request_key=?',(key,)).fetchone()
            if previous:
                if previous['customer_id'] != account['id'] or previous['payload_hash'] != digest:
                    return self.send_json({'error':'Request key already used for a different order'},409)
                return self.send_json({'id':previous['id'],'token':previous['token'],'total_cents':previous['total_cents']})
            if method == 'khqr' and not db.execute("SELECT value FROM settings WHERE key='qr' AND value!=''").fetchone():
                raise ValueError('KHQR has not been configured yet')
            fee_row = db.execute("SELECT value FROM settings WHERE key='delivery_cents'").fetchone()
            delivery = int(fee_row['value']) if fee_row else 0
            if data.get('delivery_cents') != delivery:
                return self.send_json({'error':'Delivery fee changed. Refresh checkout and review the total.'},409)
            selected = []
            seen = set()
            for item in items:
                if not isinstance(item, dict):
                    raise ValueError('Invalid cart item')
                id = clean(item.get('id'),'product id',100)
                qty = integer(item.get('quantity'),'quantity',1,10000)
                if id in seen:
                    raise ValueError('Duplicate product')
                seen.add(id)
                product = db.execute('SELECT * FROM products WHERE id=? AND active=1',(id,)).fetchone()
                if not product or product['price_cents'] is None or product['stock'] < qty:
                    raise ValueError('A product is unavailable or has insufficient stock. Refresh your cart.')
                if item.get('price_cents') != product['price_cents']:
                    return self.send_json({'error':'Price changed. Refresh products and review your cart.'},409)
                selected.append((product,qty))
            total = sum(product['price_cents']*qty for product,qty in selected) + delivery
            id = 'SC-'+secrets.token_hex(5).upper()
            token = secrets.token_urlsafe(32)
            db.execute('INSERT INTO orders(id,token,request_key,payload_hash,customer,phone,address,note,total_cents,payment_method,customer_id,delivery_cents) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)',(id,token,key,digest,customer,phone,address,note,total,method,account['id'],delivery))
            db.execute('INSERT INTO order_events(order_id,status,actor) VALUES(?,?,?)',(id,'pending',account['id']))
            for product,qty in selected:
                db.execute('INSERT INTO order_items VALUES(?,?,?,?,?,?)',(id,product['id'],product['name'],product['unit'],qty,product['price_cents']))
                db.execute('UPDATE products SET stock=stock-?,version=version+1,updated_at=CURRENT_TIMESTAMP WHERE id=?',(qty,product['id']))
                db.execute('INSERT INTO stock_movements(product_id,delta,reason,actor) VALUES(?,?,?,?)',(product['id'],-qty,'Order '+id,'Customer'))
        return self.send_json({'id':id,'token':token,'total_cents':total},201)

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--port',type=int,default=8766)
    args = parser.parse_args()
    initialize()
    print(f'Smart Chomka: http://127.0.0.1:{args.port}/#market\nAdmin: http://127.0.0.1:{args.port}/admin/',flush=True)
    ThreadingHTTPServer(('127.0.0.1',args.port),Handler).serve_forever()
