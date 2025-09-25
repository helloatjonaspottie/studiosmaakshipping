export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const body = req.body || {};
  const items = (body.content && body.content.items) || [];

  const hasPickupOnlyItem = items.some(i => i.shippable === false);
  const hasShippableItem = items.some(i => i.shippable === true);

  // Scenario 1: Alleen non-shippable items
  if (hasPickupOnlyItem && !hasShippableItem) {
    return res.status(200).json({
      rates: [{
        cost: 0,
        description: "Afhalen in de winkel (Markt 16, Oedelem)",
        userDefinedId: "pickup_store"
      }]
    });
  }

  // Scenario 2: Mix van pickup + shippable items
  if (hasPickupOnlyItem && hasShippableItem) {
    return res.status(200).json({
      rates: [{
        cost: 0,
        description: "Afhalen in de winkel (Markt 16, Oedelem) — geen levering mogelijk",
        userDefinedId: "pickup_store_only"
      }]
    });
  }

  // Scenario 3: Alleen shippable items
  return res.status(200).json({
    rates: [
      { cost: 6.95, description: "Standaard levering (2-3 dagen)", userDefinedId: "shipping_standard" },
      { cost: 12.50, description: "Express levering (1 dag)", userDefinedId: "shipping_express" }
    ]
  });
}