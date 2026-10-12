import mongoose from 'mongoose';

/**
 * Integration tests run against a REAL MongoDB.
 * - In GitHub Actions a mongo:7 service container provides MONGO_URI_TEST.
 * - Locally: docker run -d -p 27017:27017 mongo:7
 *            then: MONGO_URI_TEST=mongodb://localhost:27017/auth_test npm run test:int
 * Without MONGO_URI_TEST these tests are skipped.
 */
const uri = process.env.MONGO_URI_TEST;
const describeIfDb = uri ? describe : describe.skip;

describeIfDb('integration: MongoDB connection', () => {
  beforeAll(async () => {
    await mongoose.connect(uri as string);
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  });

  it('connects to the test database', () => {
    expect(mongoose.connection.readyState).toBe(1);
  });
});
