import app from '../../../../app';
import request from 'supertest';

describe('POST /forget-password', function () {
  it('responds with json', function (done) {
    request(app)
      .post('/api/auth/forget-password')
      .set('device-token', 'jkjkj')
      .send({
        mobile: '8878789099',
      })
      .expect(200)
      .end(function (err, res) {
        if (err) return done(err);
        return done();
      });
  })
})