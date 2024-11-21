import { beforeAll, afterAll } from 'vitest';
import http from 'http';
import { requestHandler } from '../../server';

let server: http.Server;

beforeAll(() => {
  return new Promise<void>((resolve) => {
    server = http.createServer(requestHandler);
    server.listen(3001, () => {
      console.log('Test server started on port 3001');
      resolve();
    });
  });
});

afterAll(() => {
  return new Promise<void>((resolve) => {
    server.close(() => {
      console.log('Test server closed');
      resolve();
    });
  });
}); 