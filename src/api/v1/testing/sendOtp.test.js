import app from '../../../../app';
import request from 'supertest';

describe('POST /send-otp', function () {
  it('responds with json', function (done) {
    request(app)
      .post('/api/auth/send-otp')
      .set('device-token', 'jkjkj')
      .set({ Authorization: 'jhjhj' })
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