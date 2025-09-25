// api/snipcart-shipping.js
// Node 18+ runtime (Vercel). Deploy op Vercel of adapt voor Netlify (onderaan).
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const SNIPCART_API_KEY = process.env.SNIPCART_API_KEY;
  // Als je gemixte carts wilt blokkeren: zet ALLOW_MIXED=true in env om het toe te staan
  const ALLOW_MIXED = process.env.ALLOW_MIXED === 'true';

  // Optioneel: valideren van Snipcart token (aanbevolen). Snipcart stuurt header 'X-Snipcart-RequestToken'.
  const token = req.headers['x-snipcart-requesttoken'];
  if (token) {
    try {
      const auth = 'Basic ' + Buffer.from(`${SNIPCART_API_KEY}:`).toString('base64');
      const vres = await fetch(`https://app.snipcart.com/api/requestvalidation/${token}`, {
        headers: { Authorization: auth }
      });
      if (!vres.ok) return res.status(403).json({ errors: [{ message: 'Invalid Snipcart token' }] });
      const vjson = await vres.json();
      if (vjson.token !== token) return res.status(403).json({ errors: [{ message: 'Token mismatch' }] });
    } catch (e) {
      console.error('token validation error', e);
      return res.status(500).json({ errors:[{ message: 'Webhook validation failed' }]});
    }
  }

  // Body volgens Snipcart: payload zit in req.body.content en bevat items[]. 'shippable' staat op elk item. 
  const body = req.body || {};
  const items = (body.content && body.content.items) || [];

  // Detecties
  const allNonShippable = items.length > 0 && items.every(i => i.shippable === false);
  const hasShippable = items.some(i => i.shippable === true);
  const hasNonShippable = items.some(i => i.shippable === false);

  // 1) Als ALLE items niet-shippable => bied enkel afhaal aan
  if (allNonShippable) {
    return res.status(200).json({
      rates: [{
        cost: 0,
        description: "Afhalen in de winkel (Markt 16, Oedelem)",
        userDefinedId: "pickup_store"
      }]
    });
  }

  // 2) Als mixed cart en jij wilt dat blokkeren: return error (Snipcart toont fout in checkout)
  if (!ALLOW_MIXED && hasShippable && hasNonShippable) {
    return res.status(200).json({
      errors: [{
        key: "mixed_shippable_pickup",
        message: "Je kunt geen verzend- en afhaal-items combineren. Plaats ze in aparte bestellingen of verwijder afhaal-artikelen."
      }]
    });
  }

  // 3) Anders: toon normale shipping rates (statics of bereken via carriers / API)
  return res.status(200).json({
    rates: [
      { cost: 6.95, description: "Standaard levering (2-3 dagen)", userDefinedId: "shipping_standard" },
      { cost: 12.50, description: "Express levering (1 dag)", userDefinedId: "shipping_express" }
    ]
  });
}
