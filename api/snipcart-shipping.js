export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const body = req.body || {};
  const items = (body.content && body.content.items) || [];

  // Als er minstens één pickup-only item aanwezig is, laat alleen pickup-optie toe
  const hasPickupOnlyItem = items.some(item => item.shippable === false);
  if (hasPickupOnlyItem) {
    return res.status(200).json({
      rates: [
        {
          cost: 0,
          description: "Afhalen in de winkel (Markt 16, Oedelem)",
          userDefinedId: "pickup_only"
        }
      ]
    });
  }

  // Anders: reguliere verzendopties
  return res.status(200).json({
    rates: [
      { cost: 6.95, description: "Standaard levering (2-3 dagen)", userDefinedId: "shipping_standard" },
      { cost: 12.50, description: "Express levering (1 dag)", userDefinedId: "shipping_express" }
    ]
  });
}