const url = 'https://iwrtrcynjwicnsuzpfju.supabase.co';
const key = 'sb_publishable_SZvWkp3ZiEpPFEqJeIH0oA_VJjkqni5';

fetch(`${url}/rest/v1/profiles?select=id,full_name,role`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` }
})
    .then(r => r.json())
    .then(data => {
        console.log("Profiles in database:");
        data.forEach(p => {
            console.log(`- ID: ${p.id} | Name: "${p.full_name}" | Role: ${p.role}`);
        });
    })
    .catch(err => console.error(err));
