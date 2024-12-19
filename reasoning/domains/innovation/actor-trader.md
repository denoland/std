# Trader

**Definition**: A type of [Actor](actor.md) that engages in post-market value
exchange by offering [Assets](asset.md) to Contributors in order to become a
late [Funder](actor.md#funder).

**Description**: Traders facilitate after-market value discovery and
compensation by:

- Assessing the realized value of existing [Contributions](contribution.md)
  through [Impact Crystal](impact-crystal.md) analysis
- Offering [Assets](asset.md) to Contributors through
  [Payment Paths](payment-path.md)
- Being attributed to as a contributor because of their payments
- Balancing market inefficiencies between current and future states
- Providing potential redemption for contributors with withdrawn funding

Traders can offer assets to any type of Contributor, including other Traders,
Talent Contributors, or Funders. Their offers:

- Can be partially or fully accepted
- Are priced independently of the attribution algorithm
- Include conditions to manage risk and value alignment
- Can form complex payment chains
- Help smooth market dynamics over time

The key distinction is that trades represent potential value rather than fixed
assets:

- Actual value attribution is calculated at attribution time
- Trades are recorded as value exchanges
- Final rewards depend on current contribution snapshots
- Trading activities help balance market inefficiencies
- Traders can compensate for funding gaps from withdrawn prepayments

Traders play a key role in optimizing
[Decentralized Income](../decentralized-ai/decentralized-income.md) by:

- Providing liquidity for income streams
- Enabling early value realization
- Balancing income timing mismatches
- Supporting efficient market price discovery
