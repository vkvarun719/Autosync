import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  await prisma.statusUpdate.deleteMany()
  await prisma.poolMember.deleteMany()
  await prisma.pool.deleteMany()
  await prisma.user.deleteMany()
  await prisma.destination.deleteMany()
  await prisma.hub.deleteMany()

  const gate1 = await prisma.hub.create({ data: { name: 'Metro Station Gate 1', type: 'METRO', lat: 28.6139, lng: 77.2090 } })
  const gate2 = await prisma.hub.create({ data: { name: 'Metro Station Gate 2', type: 'METRO', lat: 28.6142, lng: 77.2095 } })
  const busDepot = await prisma.hub.create({ data: { name: 'Central Bus Depot', type: 'BUS', lat: 28.6150, lng: 77.2100 } })
  await prisma.hub.create({ data: { name: 'Railway Station Main Exit', type: 'OTHER', lat: 28.6160, lng: 77.2080 } })

  const mainGate = await prisma.destination.create({ data: { name: 'Main Campus Gate', lat: 28.6250, lng: 77.2200 } })
  await prisma.destination.create({ data: { name: 'Hostel Block A', lat: 28.6260, lng: 77.2210 } })
  await prisma.destination.create({ data: { name: 'Tech Park Gate', lat: 28.6270, lng: 77.2220 } })
  await prisma.destination.create({ data: { name: 'Library & Admin Block', lat: 28.6255, lng: 77.2215 } })
  await prisma.destination.create({ data: { name: 'Sports Ground Entry', lat: 28.6245, lng: 77.2205 } })

  await prisma.user.create({ data: { email: 'priya.sharma@university.edu.in', name: 'Priya Sharma', rollId: 'CS2021001', gender: 'FEMALE', defaultUpiId: 'priya@okicici', emergencyContact: '+91-9876543210', collegeName: 'Delhi Tech University' } })
  await prisma.user.create({ data: { email: 'rahul.verma@university.edu.in', name: 'Rahul Verma', rollId: 'EC2021042', gender: 'MALE', defaultUpiId: 'rahul@okhdfc', emergencyContact: '+91-9876543211', collegeName: 'Delhi Tech University' } })
  await prisma.user.create({ data: { email: 'ananya.singh@university.edu.in', name: 'Ananya Singh', rollId: 'ME2022015', gender: 'FEMALE', defaultUpiId: 'ananya@okaxis', emergencyContact: '+91-9876543212', collegeName: 'Delhi Tech University' } })

  console.log('Seeded successfully!')
}

main().catch(console.error).finally(() => prisma.$disconnect())
