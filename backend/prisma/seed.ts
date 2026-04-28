import { PrismaClient, LogAction, OrderStatus } from '@prisma/client'

const prisma = new PrismaClient()

function randomStock() {
  return Math.floor(Math.random() * 100) + 10
}

async function main() {
  // 🔹 Users
  const users = await prisma.user.findMany({
    where: { id: { in: [2, 3] } },
  })

  if (users.length < 2) {
    throw new Error('Users not found')
  }

  const user1 = users[0]
  const user2 = users[1]

  // 🔹 Items (createMany เร็วกว่า + skip duplicate)
  await prisma.item.createMany({
    data: [
      { sku: 'MB-AIR-M5', name: 'Macbook Air M5', category: 'Laptop' },
      { sku: 'LOGI-GPROX', name: 'Logitech G Pro X', category: 'Accessories' },
      { sku: 'KEY-CHRON-K8', name: 'Keychron K8', category: 'Keyboard' },
    ],
    skipDuplicates: true,
  })

  const items = await prisma.item.findMany()

  // 🔹 Locations
  await prisma.location.createMany({
    data: [
      { name: 'A1', capacity: 100 },
      { name: 'B1', capacity: 200 },
      { name: 'C1', capacity: 150 },
    ],
    skipDuplicates: true,
  })

  const locations = await prisma.location.findMany()

  // 🔹 Stock (ยัดทั้งหมดแบบ loop)
  const stockData = []

  for (const item of items) {
    for (const loc of locations) {
      stockData.push({
        itemId: item.id,
        locationId: loc.id,
        quantity: randomStock(),
      })
    }
  }

  await prisma.itemLocation.createMany({
    data: stockData,
    skipDuplicates: true,
  })

  // 🔹 Transfer (สุ่ม)
  await prisma.transfer.create({
    data: {
      itemId: items[0].id,
      fromLocationId: locations[0].id,
      toLocationId: locations[1].id,
      userId: user1.id,
      quantity: 5,
    },
  })

  // 🔹 Logs
  await prisma.log.createMany({
    data: [
      {
        userId: user1.id,
        itemId: items[0].id,
        locationId: locations[0].id,
        quantity: 5,
        action: LogAction.TRANSFER_OUT,
      },
      {
        userId: user1.id,
        itemId: items[0].id,
        locationId: locations[1].id,
        quantity: 5,
        action: LogAction.TRANSFER_IN,
      },
    ],
  })

  // 🔹 Order
  await prisma.order.create({
    data: {
      userId: user2.id,
      status: OrderStatus.PENDING,
      lines: {
        create: items.slice(0, 2).map((item) => ({
          itemId: item.id,
          quantity: Math.floor(Math.random() * 5) + 1,
        })),
      },
    },
  })

  console.log('✅ Seed data created (FULL SYSTEM)')
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect()
  })