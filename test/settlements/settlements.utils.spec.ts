import { buildSettlementSummary } from '../../src/settlements/settlements.utils'
import type { SettlementBooking } from '../../src/settlements/settlements.repository'

describe('buildSettlementSummary', () => {
  it('aggregates provider-wise settlement totals', () => {
    const bookings = [
      {
        id: 'booking-1',
        bookingCode: 'CODE12345678',
        guestName: null,
        finalLabor: '500.00',
        commissionAmount: '100.00',
        payoutAmount: '400.00',
        completedAt: new Date('2026-03-15T10:00:00.000Z'),
        customerUser: {
          id: 'customer-1',
          name: 'Saravanan',
          email: 'customer@example.com',
          phone: '+919876543210',
        },
        assignments: [
          {
            id: 'assignment-1',
            vendorId: 'vendor-1',
            vendor: {
              id: 'vendor-1',
              userId: 'user-vendor-1',
              kycStatus: 'VERIFIED',
              isActive: true,
              createdAt: new Date(),
              updatedAt: new Date(),
              user: {
                id: 'user-vendor-1',
                email: 'vendor@example.com',
                passwordHash: 'hash',
                name: 'Demo Vendor',
                phone: '+919900000020',
                isActive: true,
                failedLoginCount: 0,
                lockedUntil: null,
                createdAt: new Date(),
                updatedAt: new Date(),
                lastLoginAt: null,
              },
            },
            bookingId: 'booking-1',
            assignedAt: new Date(),
            acceptedAt: new Date(),
            completedAt: new Date(),
            assignmentStatus: 'ACCEPTED',
          },
        ],
      },
      {
        id: 'booking-2',
        bookingCode: 'CODE87654321',
        guestName: 'Guest Customer',
        finalLabor: '300.00',
        commissionAmount: '60.00',
        payoutAmount: '240.00',
        completedAt: new Date('2026-03-15T12:00:00.000Z'),
        customerUser: null,
        assignments: [
          {
            id: 'assignment-2',
            vendorId: 'vendor-1',
            vendor: {
              id: 'vendor-1',
              userId: 'user-vendor-1',
              kycStatus: 'VERIFIED',
              isActive: true,
              createdAt: new Date(),
              updatedAt: new Date(),
              user: {
                id: 'user-vendor-1',
                email: 'vendor@example.com',
                passwordHash: 'hash',
                name: 'Demo Vendor',
                phone: '+919900000020',
                isActive: true,
                failedLoginCount: 0,
                lockedUntil: null,
                createdAt: new Date(),
                updatedAt: new Date(),
                lastLoginAt: null,
              },
            },
            bookingId: 'booking-2',
            assignedAt: new Date(),
            acceptedAt: new Date(),
            completedAt: new Date(),
            assignmentStatus: 'ACCEPTED',
          },
        ],
      },
    ] as unknown as SettlementBooking[]

    expect(buildSettlementSummary(bookings)).toEqual([
      {
        vendorId: 'vendor-1',
        vendorName: 'Demo Vendor',
        vendorPhone: '+919900000020',
        bookingCount: 2,
        finalLaborTotal: '800.00',
        commissionTotal: '160.00',
        payoutTotal: '640.00',
        bookings: [
          {
            id: 'booking-1',
            bookingCode: 'CODE12345678',
            customerName: 'Saravanan',
            finalLabor: '500.00',
            commissionAmount: '100.00',
            payoutAmount: '400.00',
            completedAt: '2026-03-15T10:00:00.000Z',
          },
          {
            id: 'booking-2',
            bookingCode: 'CODE87654321',
            customerName: 'Guest Customer',
            finalLabor: '300.00',
            commissionAmount: '60.00',
            payoutAmount: '240.00',
            completedAt: '2026-03-15T12:00:00.000Z',
          },
        ],
      },
    ])
  })
})
