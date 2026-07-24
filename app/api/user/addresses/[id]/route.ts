import { NextRequest, NextResponse } from 'next/server';

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  // TODO: prisma.address.delete({ where: { id: Number(id) } })
  return NextResponse.json({ message: `Address ${id} deleted` });
}
