import { NextRequest, NextResponse } from 'next/server';
import { MOCK_PRODUCTS } from '../route';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const product = MOCK_PRODUCTS.find((p) => p.id === Number(id));
  if (!product || (product.status !== 'approved' && product.status !== 'active')) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 });
  }
  // TODO: replace with Prisma — prisma.product.findUnique({ where: { id } })
  return NextResponse.json({ data: product });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  // TODO: Prisma update
  return NextResponse.json({ data: { id: Number(id), ...body } });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  // TODO: Prisma delete
  return NextResponse.json({ message: `Product ${id} deleted` });
}
