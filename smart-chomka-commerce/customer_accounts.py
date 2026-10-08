"""Customer accounts and private order history for the local commerce server."""
import hashlib
import hmac
import json
import re
import secrets
import time
from http.cookies import SimpleCookie


def initialize_customers(db):
    db.executescript('''
    CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY, phone TEXT UNIQUE NOT NULL, name TEXT NOT NULL,
      salt TEXT NOT NULL, password_hash TEXT NOT NULL,
      address TEXT NOT NULL DEFAULT '', farm_json TEXT NOT NULL DEFAULT '{}',
      version INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE IF NOT EXISTS customer_sessions (
      token_hash TEXT PRIMARY KEY, customer_id TEXT NOT NULL REFERENCES customers(id), expires REAL NOT NULL);
    CREATE TABLE IF NOT EXISTS order_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT, order_id TEXT NOT NULL REFERENCES orders(id),
      status TEXT NOT NULL, actor TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
    ''')
    columns = {row['name'] for row in db.execute('PRAGMA table_info(orders)')}
    if 'customer_id' not in columns:
        db.execute('ALTER TABLE orders ADD COLUMN customer_id TEXT REFERENCES customers(id)')
    if 'delivery_cents' not in columns:
        db.execute('ALTER TABLE orders ADD COLUMN delivery_cents INTEGER NOT NULL DEFAULT 0')
    db.execute('CREATE INDEX IF NOT EXISTS orders_customer ON orders(customer_id,created_at)')


def normalize_phone(value):
    if not isinstance(value, str) or not re.fullmatch(r'\+?[0-9 ()-]{7,24}', value):
        raise ValueError('Enter a valid Cambodian phone number')
    phone = re.sub(r'[^0-9]', '', value)
    if phone.startswith('0'):
        phone = '855' + phone[1:]
    if not re.fullmatch(r'855[1-9][0-9]{7,8}', phone):
        raise ValueError('Use a Cambodian phone number, for example 012345678')
    return '+' + phone


def public_customer(row):
    return {**{key: row[key] for key in ('id','name','phone','address','version')}, 'farm': json.loads(row['farm_json'])}


class CustomerMixin:
    def customer(self):
        from server import connect
        cookie = SimpleCookie(self.headers.get('Cookie',''))
        token = cookie.get('chomka_customer')
        digest = hashlib.sha256((token.value if token else '').encode()).hexdigest()
        with connect() as db:
            row = db.execute('SELECT c.* FROM customers c JOIN customer_sessions s ON s.customer_id=c.id WHERE s.token_hash=? AND s.expires>?', (digest,time.time())).fetchone()
        if not row:
            raise PermissionError('Sign in to your shared account first')
        return row

    def customer_get(self, path):
        from server import connect
        if path == '/commerce-api/customer/me':
            return self.send_json(public_customer(self.customer()))
        if path == '/commerce-api/customer/orders':
            customer = self.customer()
            with connect() as db:
                orders = [dict(row) for row in db.execute('SELECT id,customer,phone,address,note,status,payment_method,payment_status,total_cents,delivery_cents,created_at FROM orders WHERE customer_id=? ORDER BY created_at DESC,rowid DESC LIMIT 200', (customer['id'],))]
                for order in orders:
                    order['items'] = [dict(row) for row in db.execute('SELECT name,unit,quantity,price_cents FROM order_items WHERE order_id=?',(order['id'],))]
                    order['events'] = [dict(row) for row in db.execute('SELECT status,created_at FROM order_events WHERE order_id=? ORDER BY id',(order['id'],))]
            return self.send_json(orders)
        return self.send_json({'error':'Not found'},404)

    def customer_post(self, path, data):
        from server import connect, clean, integer, password_hash, ATTEMPTS
        if path in ('/commerce-api/customer/register','/commerce-api/customer/login'):
            address = 'customer:'+self.client_address[0]
            recent = [stamp for stamp in ATTEMPTS.get(address,[]) if stamp > time.time()-300]
            if len(recent) >= 15:
                return self.send_json({'error':'Too many attempts. Try again in 5 minutes.'},429)
            ATTEMPTS[address] = recent + [time.time()]
            phone = normalize_phone(data.get('phone'))
            password = data.get('password')
            if not isinstance(password,str) or not 12 <= len(password) <= 256:
                raise ValueError('Use a password of 12–256 characters')
            with connect() as db:
                db.execute('BEGIN IMMEDIATE')
                row = db.execute('SELECT * FROM customers WHERE phone=?',(phone,)).fetchone()
                if path.endswith('/register'):
                    if row:
                        raise ValueError('This phone is already registered. Sign in instead.')
                    name = clean(data.get('name'),'name',120)
                    salt = secrets.token_hex(16)
                    id = secrets.token_hex(16)
                    db.execute('INSERT INTO customers(id,phone,name,salt,password_hash) VALUES(?,?,?,?,?)',(id,phone,name,salt,password_hash(password,salt)))
                    row = db.execute('SELECT * FROM customers WHERE id=?',(id,)).fetchone()
                elif not row or not hmac.compare_digest(row['password_hash'],password_hash(password,row['salt'])):
                    raise PermissionError('Phone number or password is incorrect')
                token = secrets.token_urlsafe(32)
                db.execute('DELETE FROM customer_sessions WHERE expires<?',(time.time(),))
                db.execute('INSERT INTO customer_sessions VALUES(?,?,?)',(hashlib.sha256(token.encode()).hexdigest(),row['id'],time.time()+7*86400))
            return self.send_json(public_customer(row),cookie=f'chomka_customer={token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=604800')
        if path == '/commerce-api/customer/logout':
            cookie = SimpleCookie(self.headers.get('Cookie',''))
            token = cookie.get('chomka_customer')
            if token:
                with connect() as db:
                    db.execute('DELETE FROM customer_sessions WHERE token_hash=?',(hashlib.sha256(token.value.encode()).hexdigest(),))
            return self.send_json({'ok':True},cookie='chomka_customer=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0')
        customer = self.customer()
        if path == '/commerce-api/customer/profile':
            name = clean(data.get('name'),'name',120)
            address = clean(data.get('address',''),'address',600,False)
            farm = data.get('farm',{})
            if not isinstance(farm,dict):
                raise ValueError('Invalid farm profile')
            farm = {key:clean(farm.get(key,''),key,200,False) for key in ('name','location','crop','variety','trees','area','age','irrigation')}
            version = integer(data.get('version'),'version',1)
            with connect() as db:
                result = db.execute('UPDATE customers SET name=?,address=?,farm_json=?,version=version+1 WHERE id=? AND version=?',(name,address,json.dumps(farm,ensure_ascii=False),customer['id'],version))
                if not result.rowcount:
                    return self.send_json({'error':'Profile changed on another device. Reload your account before saving.'},409)
                row = db.execute('SELECT * FROM customers WHERE id=?',(customer['id'],)).fetchone()
            return self.send_json(public_customer(row))
        if path == '/commerce-api/customer/password':
            old = data.get('current_password','')
            new = data.get('password','')
            if not isinstance(old,str) or len(old)>256 or not hmac.compare_digest(customer['password_hash'],password_hash(old,customer['salt'])):
                raise PermissionError('Current password is incorrect')
            if not isinstance(new,str) or not 12<=len(new)<=256:
                raise ValueError('Use a password of 12–256 characters')
            salt = secrets.token_hex(16)
            with connect() as db:
                db.execute('UPDATE customers SET salt=?,password_hash=? WHERE id=?',(salt,password_hash(new,salt),customer['id']))
                db.execute('DELETE FROM customer_sessions WHERE customer_id=?',(customer['id'],))
            return self.send_json({'ok':True},cookie='chomka_customer=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0')
        if path == '/commerce-api/customer/cancel-order':
            with connect() as db:
                db.execute('BEGIN IMMEDIATE')
                order = db.execute('SELECT * FROM orders WHERE id=? AND customer_id=?',(data.get('id'),customer['id'])).fetchone()
                if not order:
                    return self.send_json({'error':'Order not found'},404)
                if order['status']=='cancelled':
                    return self.send_json({'ok':True})
                if order['status']!='pending' or order['payment_status']=='paid' or order['payment_method']=='khqr':
                    raise ValueError('Contact the seller to cancel this order; payment or fulfilment needs review.')
                for item in db.execute('SELECT * FROM order_items WHERE order_id=?',(order['id'],)).fetchall():
                    db.execute('UPDATE products SET stock=stock+?,version=version+1,updated_at=CURRENT_TIMESTAMP WHERE id=?',(item['quantity'],item['product_id']))
                    db.execute('INSERT INTO stock_movements(product_id,delta,reason,actor) VALUES(?,?,?,?)',(item['product_id'],item['quantity'],'Cancelled '+order['id'],customer['id']))
                db.execute("UPDATE orders SET status='cancelled' WHERE id=?",(order['id'],))
                db.execute('INSERT INTO order_events(order_id,status,actor) VALUES(?,?,?)',(order['id'],'cancelled',customer['id']))
            return self.send_json({'ok':True})
        return self.send_json({'error':'Not found'},404)
