import { PrismaClient } from '@prisma/client'
import { PICKUP_LOCATIONS, DESTINATION_RVITM } from '../src/lib/locations'

const prisma = new PrismaClient()

async function main() {
  await prisma.statusUpdate.deleteMany()
  await prisma.poolMember.deleteMany()
  await prisma.pool.deleteMany()
  await prisma.session.deleteMany()
  await prisma.otpVerification.deleteMany()
  await prisma.user.deleteMany()
  await prisma.destination.deleteMany()
  await prisma.hub.deleteMany()

  // 1. Seed 6 Fixed Pickup Hubs
  for (const loc of PICKUP_LOCATIONS) {
    await prisma.hub.create({
      data: {
        id: loc.id,
        name: loc.name,
        type: loc.type,
        lat: loc.lat,
        lng: loc.lng
      }
    })
  }

  // 2. Seed RVITM Destination
  await prisma.destination.create({
    data: {
      id: DESTINATION_RVITM.id,
      name: DESTINATION_RVITM.name,
      lat: DESTINATION_RVITM.lat,
      lng: DESTINATION_RVITM.lng
    }
  })

  // 3. Seed RVITM Student Personas
  await prisma.user.create({
    data: {
      email: 'rvit22bcs085.rvitm@rvei.edu.in',
      name: 'Priya Sharma',
      rollId: 'RVIT22BCS085',
      gender: 'FEMALE',
      defaultUpiId: 'priya@okicici',
      emergencyContact: '+91-9876543210',
      collegeName: 'R V Institute of Technology and Management'
    }
  })

  await prisma.user.create({
    data: {
      email: 'rvit22bec042.rvitm@rvei.edu.in',
      name: 'Rahul Verma',
      rollId: 'RVIT22BEC042',
      gender: 'MALE',
      defaultUpiId: 'rahul@okhdfc',
      emergencyContact: '+91-9876543211',
      collegeName: 'R V Institute of Technology and Management'
    }
  })

  await prisma.user.create({
    data: {
      email: 'rvit23bis019.rvitm@rvei.edu.in',
      name: 'Ananya Singh',
      rollId: 'RVIT23BIS019',
      gender: 'FEMALE',
      defaultUpiId: 'ananya@okaxis',
      emergencyContact: '+91-9876543212',
      collegeName: 'R V Institute of Technology and Management'
    }
  })

  // Sample student
  await prisma.user.create({
    data: {
      email: 'rvit25bai050.rvitm@rvei.edu.in',
      name: 'Student RVIT25BAI050',
      rollId: 'RVIT25BAI050',
      gender: 'OTHER',
      defaultUpiId: 'rvit25bai050@okhdfc',
      collegeName: 'R V Institute of Technology and Management'
    }
  })

  console.log('RVITM Locations, Destination, and Students seeded successfully!')
}

main().catch(console.error).finally(() => prisma.$disconnect())
