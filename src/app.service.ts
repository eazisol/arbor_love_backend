import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Health 100 : Arbor love backend sarted successfully!';
  }
}
