import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  context: { params: Promise<{ isbn: string }> }
) {
  const { isbn } = await context.params  // await 추가!
  
  console.log('API called with ISBN:', isbn)
  
  if (!isbn) {
    return NextResponse.json({ error: 'ISBN is required' }, { status: 400 })
  }

  try {
    const apiUrl = `http://www.aladin.co.kr/ttb/api/ItemLookUp.aspx?ttbkey=${process.env.NEXT_PUBLIC_ALADIN_API_KEY}&itemIdType=ISBN13&ItemId=${isbn}&output=js&Version=20131101&OptResult=ebookList,usedList,reviewList`
    
    console.log('Fetching from Aladin API...')
    
    const response = await fetch(apiUrl)
    const data = await response.json()
    
    console.log('Data received')
    
    return NextResponse.json(data)
  } catch (error) {
    console.error('Book detail error:', error)
    return NextResponse.json({ error: 'Failed to fetch book details' }, { status: 500 })
  }
}