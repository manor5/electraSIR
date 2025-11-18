import { testConnection, searchElectors } from './app/actions/searchActions';

async function test() {
  console.log('Testing database connection...');
  
  // Test connection
  const connectionResult = await testConnection();
  console.log('Connection test:', connectionResult);

  if (connectionResult.success) {
    console.log('\nTesting search by name...');
    const searchResult = await searchElectors({
      name: 'ரஜினி'
    });
    console.log('Search results:', searchResult);

    console.log('\nTesting search by booth number...');
    const boothSearch = await searchElectors({
      boothNumber: '1'
    });
    console.log('Booth search results:', boothSearch);
  }
  
  process.exit(0);
}

test().catch(console.error);
