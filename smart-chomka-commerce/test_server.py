import concurrent.futures
import json
import tempfile
import threading
import unittest
from pathlib import Path
from urllib.request import Request, urlopen
from urllib.error import HTTPError
import server

class CommerceTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.temp=tempfile.TemporaryDirectory()
        server.DB=Path(cls.temp.name)/'test.sqlite3'
        server.initialize()
        cls.http=server.ThreadingHTTPServer(('127.0.0.1',0),server.Handler)
        cls.url='http://127.0.0.1:'+str(cls.http.server_port)
        threading.Thread(target=cls.http.serve_forever,daemon=True).start()
        _,_,headers=cls.call('setup',{'username':'testadmin','password':'Test-password-12345'})
        cls.cookie=headers.get('Set-Cookie').split(';')[0]
        _,_,headers=cls.call('customer/register',{'name':'Buyer','phone':'012345678','password':'Buyer-password-12345'})
        cls.buyer_cookie=headers.get('Set-Cookie').split(';')[0]

    @classmethod
    def tearDownClass(cls):
        cls.http.shutdown();cls.http.server_close();cls.temp.cleanup()

    @classmethod
    def call(cls,path,body=None,admin=False,headers=None):
        hdr={'Content-Type':'application/json',**(headers or {})}
        if admin:hdr['Cookie']=cls.cookie
        elif path=='orders' and 'Cookie' not in hdr:hdr['Cookie']=cls.buyer_cookie
        request=Request(cls.url+'/commerce-api/'+path, data=json.dumps(body).encode() if body is not None else None,headers=hdr)
        try:
            with urlopen(request) as response:return response.status,json.load(response),response.headers
        except HTTPError as error:return error.code,json.load(error),error.headers

    def product(self,stock=3):
        status,result,_=self.call('admin/product',{'name':'Test durian','category':'durian','supplier':'Test farm','unit':'kg','stock':stock,'price_cents':500,'active':True},True)
        self.assertEqual(status,200);return result['id']

    def order(self,id,key,qty=1,method='cash_on_delivery'):
        return {'delivery_cents':0,'customer':'Test buyer','phone':'012345678','address':'Test address','note':'','payment_method':method,'request_key':key,'items':[{'id':id,'quantity':qty,'price_cents':500}]}

    def test_access_and_setup(self):
        self.assertEqual(self.call('admin/data')[0],401)
        self.assertEqual(self.call('admin/product',{},True,{'Origin':'http://evil.example'})[0],401)
        self.assertEqual(self.call('setup',{'username':'other','password':'Other-password-123'})[0],409)

    def test_price_idempotency_and_cancel(self):
        id=self.product();body=self.order(id,'retry-key')
        body['items'][0]['price_cents']=1
        self.assertEqual(self.call('orders',body)[0],409)
        body['items'][0]['price_cents']=500
        status,order,_=self.call('orders',body);self.assertEqual(status,201)
        retry=self.call('orders',body)[1];self.assertEqual(order['id'],retry['id'])
        self.assertEqual(self.call('orders/'+order['id'])[0],404)
        self.assertEqual(self.call('orders/'+order['id'],headers={'X-Order-Token':order['token']})[0],200)
        self.assertEqual(self.call('admin/order-status',{'id':order['id'],'status':'cancelled'},True)[0],200)
        self.call('admin/order-status',{'id':order['id'],'status':'cancelled'},True)
        rows=self.call('admin/data',admin=True)[1]['products']
        self.assertEqual(next(p for p in rows if p['id']==id)['stock'],3)
        self.assertEqual(self.call('admin/order-status',{'id':order['id'],'status':'confirmed'},True)[0],400)

    def test_concurrent_last_unit(self):
        id=self.product(1)
        with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
            statuses=list(pool.map(lambda key:self.call('orders',self.order(id,key))[0],['race-1','race-2']))
        self.assertEqual(sorted(statuses),[201,400])

    def test_khqr_and_stock_version(self):
        id=self.product()
        self.assertEqual(self.call('orders',self.order(id,'no-qr',method='khqr'))[0],400)
        self.assertEqual(self.call('admin/payments',{'merchant':'TEST ONLY','qr':'data:image/png;base64,iVBORw0KGgo='},True)[0],200)
        status,order,_=self.call('orders',self.order(id,'with-qr',method='khqr'));self.assertEqual(status,201)
        self.assertEqual(self.call('admin/payment-confirm',{'id':order['id']},True)[0],200)
        view=self.call('orders/'+order['id'],headers={'X-Order-Token':order['token']})[1]
        self.assertEqual(view['payment_status'],'paid');self.assertEqual(view['payment_method'],'khqr')
        stale={'id':id,'version':1,'name':'Changed','category':'durian','unit':'kg','price_cents':500,'stock':30,'active':True}
        self.assertEqual(self.call('admin/product',stale,True)[0],409)
        self.call('admin/payments',{'merchant':'','qr':''},True)

if __name__=='__main__':unittest.main()
