

const chai =  require('chai') 
const expect = chai.expect;
const chaiHttp = require('chai-http')
chai.use(chaiHttp)
const app = require('../app');

describe ('User Auth Routes', function() {
    it('Users Can Login with right credentials',  async () => {
        let res = await chai 
        .request(app)
        .post('/api/login')
        .send({
            'email':'taiwo.akinseye@gmail.com',
            'password':'tjflash83'
        })
       expect(res.status).to.equal(200)
    });
    
    it('Users Cannot login with wrong credentials',  async () => {
        let res = await chai 
        .request(app)
        .post('/api/login')
        .send({
            'email':'taiwo.akinseye@gmail.com',
            'password':'tjflash80'
        })
         expect(res.status).to.equal(401)
       
    });
});

