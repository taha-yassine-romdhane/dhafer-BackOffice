import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const LOCATIONS = ['Jammel', 'tunis', 'sousse', 'online']
const POSITION_DESCRIPTIONS = {
  1: "front",
  2: "back",
  3: "side-right",
  4: "side-left",
  5: "detail"
}

async function main() {
  console.log('Starting database seed...')

  // First, clean up existing data
  console.log('Cleaning existing data...')
  await prisma.stock.deleteMany({})
  await prisma.productImage.deleteMany({})
  await prisma.colorVariant.deleteMany({})
  await prisma.product.deleteMany({})

  // Create one product with all color variants
  const product = await prisma.product.create({
    data: {
      name: "Elegant Koftan Collection",
      description: "A stunning Koftan design available in multiple colors. Each piece is carefully crafted with attention to detail, featuring traditional patterns with a modern twist. Perfect for special occasions and celebrations.",
      price: 399.99,
      category: "caftan",
      sizes: ['36', '38', '40', '42', '44', '46', '48','50','52','54','56'],
      colorVariants: {
        create: [
          {
            color: "rouge",
            images: {
              create: Array.from({ length: 4 }, (_, i) => ({
                url: `/product_1_imgs/produit_1_pos_${i + 1}_rouge.png`,
                isMain: i === 0,
                position: POSITION_DESCRIPTIONS[i + 1 as keyof typeof POSITION_DESCRIPTIONS] || `position_${i + 1}`
              }))
            }
          },
          {
            color: "blue",
            images: {
              create: Array.from({ length: 4 }, (_, i) => ({
                url: `/product_1_imgs/produit_2_pos_${i + 1}_blue.png`,
                isMain: i === 0,
                position: POSITION_DESCRIPTIONS[i + 1 as keyof typeof POSITION_DESCRIPTIONS] || `position_${i + 1}`
              }))
            }
          },
          {
            color: "noire",
            images: {
              create: [
                ...Array.from({ length: 5 }, (_, i) => ({
                  url: `/product_1_imgs/produit_3_pos_${i + 1}_noire.png`,
                  isMain: i === 0,
                  position: POSITION_DESCRIPTIONS[i + 1 as keyof typeof POSITION_DESCRIPTIONS] || `position_${i + 1}`
                })),
                ...Array.from({ length: 5 }, (_, i) => ({
                  url: `/product_1_imgs/produit_4_pos_${i + 1}_noire.png`,
                  isMain: false,
                  position: `${POSITION_DESCRIPTIONS[i + 1 as keyof typeof POSITION_DESCRIPTIONS]}-alt` || `position_${i + 1}_alt`
                }))
              ]
            }
          }
        ]
      }
    },
    include: {
      colorVariants: true
    }
  })
  
  console.log(`Created product: ${product.name} with all color variants`)

  // Create the second product
  const product2 = await prisma.product.create({
    data: {
      name: "Modern Koftan Design",
      description: "A contemporary take on the traditional Koftan, featuring elegant embroidery and premium fabric. Perfect for modern occasions while maintaining cultural authenticity.",
      price: 449.99,
      category: "caftan",
      sizes: ['1', '2', '3','34', '4','5','6','M','S'],
      colorVariants: {
        create: [
          {
            color: "beige",
            images: {
              create: Array.from({ length: 5 }, (_, i) => ({
                url: `/products_2_imgs/beige_position_${i + 1}.png`,
                isMain: i === 0,
                position: POSITION_DESCRIPTIONS[i + 1 as keyof typeof POSITION_DESCRIPTIONS] || `position_${i + 1}`
              }))
            }
          },
          {
            color: "blue",
            images: {
              create: Array.from({ length: 5 }, (_, i) => ({
                url: `/products_2_imgs/blue_position_${i + 1}.png`,
                isMain: i === 0,
                position: POSITION_DESCRIPTIONS[i + 1 as keyof typeof POSITION_DESCRIPTIONS] || `position_${i + 1}`
              }))
            }
          },
          {
            color: "noire",
            images: {
              create: Array.from({ length: 6 }, (_, i) => ({
                url: `/products_2_imgs/noire_position_${i + 1}.png`,
                isMain: i === 0,
                position: POSITION_DESCRIPTIONS[i + 1 as keyof typeof POSITION_DESCRIPTIONS] || `position_${i + 1}`
              }))
            }
          },
          {
            color: "verte",
            images: {
              create: Array.from({ length: 3 }, (_, i) => ({
                url: `/products_2_imgs/verte_position_${i + 1}.png`,
                isMain: i === 0,
                position: POSITION_DESCRIPTIONS[i + 1 as keyof typeof POSITION_DESCRIPTIONS] || `position_${i + 1}`
              }))
            }
          },
          {
            color: "bordeaux",
            images: {
              create: [
                {
                  url: `/products_2_imgs/bordeaux_position_1.png`,
                  isMain: true,
                  position: POSITION_DESCRIPTIONS[1]
                }
              ]
            }
          }
        ]
      }
    },
    include: {
      colorVariants: true
    }
  })

  console.log(`Created product 2: ${product2.name} with all color variants`)

  // Create stock entries for each location, size, and color for product 2
  const stockPromises = []
  
  for (const location of LOCATIONS) {
    for (const size of product2.sizes) {
      for (const colorVariant of product2.colorVariants) {
        const quantity = Math.floor(Math.random() * 13) + 3
        
        stockPromises.push(
          prisma.stock.create({
            data: {
              location,
              quantity,
              size,
              productId: product2.id,
              colorId: colorVariant.id
            }
          })
        )
      }
    }
  }

  // Create stock entries for each location, size, and color
  console.log('Creating stock entries...')
  
  for (const location of LOCATIONS) {
    for (const size of product.sizes) {
      for (const colorVariant of product.colorVariants) {
        // Generate random stock quantity between 3 and 15
        const quantity = Math.floor(Math.random() * 13) + 3
        
        stockPromises.push(
          prisma.stock.create({
            data: {
              location,
              quantity,
              size,
              productId: product.id,
              colorId: colorVariant.id
            }
          })
        )
      }
    }
  }

  await Promise.all(stockPromises)
  console.log('Created stock entries for all locations')

  console.log('Seeding completed!')
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })