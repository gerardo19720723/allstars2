import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Creando Tenant de prueba...');

  const tenant = await prisma.tenant.create({
    data: {
      slug: 'demo-club',
      name: 'AllStars Demo Club',
    },
  });

  console.log('✅ Tenant creado exitosamente!');
  console.log(`------------------------------------------------`);
  console.log(`ID: ${tenant.id}`);
  console.log(`Slug: ${tenant.slug}`);
  console.log(`------------------------------------------------`);
  console.log('📋 COPIA EL ID DE ARRIBA PARA EL REGISTRO');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });