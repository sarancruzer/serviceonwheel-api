import { Module } from '@nestjs/common'
import { BookingsModule } from '../bookings/bookings.module'
import { CustomerAddressesController } from './customer-addresses.controller'
import { CustomerBookingsController } from './customer-bookings.controller'
import { CustomerProfileController } from './customer-profile.controller'
import { CustomersRepository } from './customers.repository'
import { CustomersService } from './customers.service'

@Module({
  imports: [BookingsModule],
  controllers: [CustomerProfileController, CustomerAddressesController, CustomerBookingsController],
  providers: [CustomersRepository, CustomersService],
})
export class CustomersModule {}
