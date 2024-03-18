import app from '../../../../app';
import request from 'supertest';

describe('POST /verify-otp', function () {
  it('responds with json', function (done) {
    request(app)
      .post('/api/auth/verify-otp')
      .set('device-token', 'jkjkj')
      .set({ Authorization: 'jhjhj' })
      .send({
        mobile: '8878789099',
        otp: '4543',
      })
      .expect(200)
      .end(function (err, res) {
        if (err) return done(err);
        return done();
      });
  })
})