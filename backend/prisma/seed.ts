import { PrismaClient, Role, LogAction, OrderStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.systemSetting.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      defaultReorderPoint: 10,
      lowStockBuffer: 0,
      allocationStrategy: 'FIFO',
    },
  });
  // 🔹 Users
  const user1 = await prisma.user.findUnique({
    where: { id: 2 },
  });

  const user2 = await prisma.user.findUnique({
    where: { id: 3 },
  });

  if (!user1 || !user2) {
    throw new Error('User not found');
  }

  // 🔹 Items
  const item1 = await prisma.item.create({
    data: { sku: 'MB-AIR-M5', name: 'Macbook Air M5', category: 'Laptop' },
  });

  const item2 = await prisma.item.create({
    data: { sku: 'LOGI-GPROX', name: 'Logitech G Pro X', category: 'Accessories' },
  });

  // 🔹 Locations
  const loc1 = await prisma.location.create({
    data: { name: 'A1', capacity: 100 },
  });

  const loc2 = await prisma.location.create({
    data: { name: 'B1', capacity: 200 },
  });

  // 🔹 Stock (ItemLocation)
  await prisma.itemLocation.createMany({
    data: [
      {
        itemId: item1.id,
        locationId: loc1.id,
        quantity: 50,
      },
      {
        itemId: item2.id,
        locationId: loc1.id,
        quantity: 30,
      },
      {
        itemId: item1.id,
        locationId: loc2.id,
        quantity: 20,
      },
    ],
  });

  // 🔹 Transfer
  const transfer1 = await prisma.transfer.create({
    data: {
      itemId: item1.id,
      fromLocationId: loc1.id,
      toLocationId: loc2.id,
      userId: user1.id,
      quantity: 10,
    },
  });

  // 🔹 Logs
  await prisma.log.createMany({
    data: [
      {
        userId: user1.id,
        itemId: item1.id,
        locationId: loc1.id,
        quantity: 10,
        action: LogAction.TRANSFER_OUT,
      },
      {
        userId: user1.id,
        itemId: item1.id,
        locationId: loc2.id,
        quantity: 10,
        action: LogAction.TRANSFER_IN,
      },
      {
        userId: user2.id,
        itemId: item2.id,
        locationId: loc1.id,
        quantity: 5,
        action: LogAction.WITHDRAW,
      },
      {
        userId: user1.id,
        itemId: item2.id,
        locationId: loc1.id,
        quantity: 20,
        action: LogAction.ADD,
      },
    ],
  });

  // 🔹 Order + OrderLine
  const order1 = await prisma.order.create({
    data: {
      userId: user2.id,
      status: OrderStatus.PENDING,
      lines: {
        create: [
          {
            itemId: item1.id,
            quantity: 2,
          },
          {
            itemId: item2.id,
            quantity: 3,
          },
        ],
      },
    },
    include: {
      lines: true,
    },
  });

  console.log('✅ Seed data created');
}

main()
  .catch((e) => {
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
