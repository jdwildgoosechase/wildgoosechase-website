import { supabase } from '../lib/supabase'

export default async function Home() {
  const { data, error } = await supabase
    .from('fld_sightings')
    .select('*')
    .limit(1)

  if (error) {
    return <p>Error connecting to Supabase: {error.message}</p>
  }

  return (
    <div>
      <h1>Wildgoosechase</h1>
      <p>Supabase connection working!</p>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  )
}