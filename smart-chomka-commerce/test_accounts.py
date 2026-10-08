import concurrent.futures
import hashlib
import json
import secrets
import unittest
import test_server
import server

class SharedAccountsTests(test_server.CommerceTests):
    def new_customer(self):
        phone='09'+str(secrets.randbelow(10000000)).zfill(7)
        status,user,h=self.call('customer/register',{'name':'Shared buyer','phone':phone,'password':'Shared-password-12345'})
        self.assertEqual(status,200)
        return user,{'Cookie':h.get('Set-Cookie').split(';')[0]},phone

    def test_private_history_and_sessions(self):
        user,a,phone=self.new_customer();_,b,_=self.new_customer()
        id=self.product();body=self.order(id,secrets.token_hex(10))
        self.assertEqual(self.call('orders',body,headers={'Cookie':''})[0],401)
        status,order,_=self.call('orders',body,headers=a);self.assertEqual(status,201)
        self.assertEqual(self.call('orders',body,headers=b)[0],409)
        self.assertEqual(len(self.call('customer/orders',headers=a)[1]),1)
        self.assertEqual(self.call('customer/orders',headers=b)[1],[])
        self.assertEqual(self.call('customer/cancel-order',{'id':order['id']},headers=b)[0],404)
        _,_,h=self.call('customer/login',{'phone':phone,'password':'Shared-password-12345'})
        self.assertEqual(len(self.call('customer/orders',headers={'Cookie':h.get('Set-Cookie').split(';')[0]})[1]),1)
        self.call('customer/logout',{},headers=a)
        self.assertEqual(self.call('customer/me',headers=a)[0],401)

    def test_profile_version_and_password(self):
        user,a,phone=self.new_customer()
        patch={'name':'New name','address':'Kampot','farm':{'name':'My orchard','trees':'40'},'version':user['version']}
        status,saved,_=self.call('customer/profile',patch,headers=a);self.assertEqual(status,200)
        self.assertEqual(self.call('customer/profile',patch,headers=a)[0],409)
        self.assertEqual(saved['farm']['trees'],'40')
        self.assertNotIn('password_hash',saved)
        self.assertEqual(self.call('customer/profile',patch,headers={**a,'Origin':'http://evil.example'})[0],401)
        self.assertEqual(self.call('customer/password',{'current_password':'Shared-password-12345','password':'Changed-password-12345'},headers=a)[0],200)
        self.assertEqual(self.call('customer/me',headers=a)[0],401)
        self.assertEqual(self.call('customer/login',{'phone':phone,'password':'Changed-password-12345'})[0],200)

    def test_cancel_once_and_delivery(self):
        _,a,_=self.new_customer();id=self.product(3)
        self.call('admin/payments',{'merchant':'','qr':'','delivery_cents':250},True)
        body=self.order(id,secrets.token_hex(10))
        self.assertEqual(self.call('orders',body,headers=a)[0],409)
        body['delivery_cents']=250
        status,order,_=self.call('orders',body,headers=a);self.assertEqual(status,201);self.assertEqual(order['total_cents'],750)
        with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
            statuses=list(pool.map(lambda _:self.call('customer/cancel-order',{'id':order['id']},headers=a)[0],range(2)))
        self.assertEqual(statuses,[200,200])
        with server.connect() as db:
            self.assertEqual(db.execute('SELECT stock FROM products WHERE id=?',(id,)).fetchone()[0],3)
            self.assertEqual(db.execute("SELECT COUNT(*) FROM order_events WHERE order_id=? AND status='cancelled'",(order['id'],)).fetchone()[0],1)
        self.call('admin/payments',{'merchant':'','qr':'','delivery_cents':0},True)

    def test_khqr_shipping_requires_verified_payment(self):
        _,a,_=self.new_customer();id=self.product()
        self.call('admin/payments',{'merchant':'Test','qr':'data:image/png;base64,iVBORw0KGgo=','delivery_cents':0},True)
        status,order,_=self.call('orders',self.order(id,secrets.token_hex(10),method='khqr'),headers=a);self.assertEqual(status,201)
        self.assertEqual(self.call('customer/cancel-order',{'id':order['id']},headers=a)[0],400)
        self.call('admin/order-status',{'id':order['id'],'status':'confirmed'},True)
        self.assertEqual(self.call('admin/order-status',{'id':order['id'],'status':'shipped'},True)[0],400)
        self.call('admin/payment-confirm',{'id':order['id']},True)
        self.assertEqual(self.call('admin/order-status',{'id':order['id'],'status':'shipped'},True)[0],200)
        self.assertEqual(self.call('admin/order-status',{'id':order['id'],'status':'fulfilled'},True)[0],200)
        self.call('admin/payments',{'merchant':'','qr':'','delivery_cents':0},True)

if __name__=='__main__':unittest.main()
