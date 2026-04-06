import { NextRequest, NextResponse } from 'next/server';
import { getAgeBandAggregatedData } from '@/app/actions/ageBandActions';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const booth = searchParams.get('booth') || undefined;
  const ward = searchParams.get('ward') || undefined;
  const pagudhi = searchParams.get('pagudhi') || undefined;
  const result = await getAgeBandAggregatedData(booth, ward, pagudhi);
  return NextResponse.json(result);
}
