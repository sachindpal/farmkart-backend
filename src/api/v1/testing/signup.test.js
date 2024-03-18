import app from '../../../../app';
import request from 'supertest';

describe('POST /signup', function () {
  it('responds with json', function (done) {
    request(app)
      .post('/api/auth/signup')
      .set('device-token', 'jkjkj')
      .send({
        full_name: 'sachin',
        mobile: '8878789089',
        state: 1,
        district: 2,
        password: 'dfdsfd'
      })
      .expect(200)
      .end(function (err, res) {
        if (err) return done(err);
        return done();
      });
  })
})