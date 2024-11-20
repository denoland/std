# Trader

**Definition**: A type of [Actor](actor.md) that engages in post-market value exchange by offering [Assets](asset.md) to Contributors in order to become a late [Funder](actor.md#funder).

**Description**: Traders facilitate after-market value discovery and compensation by:
- Assessing the realized value of existing [Contributions](contribution.md)
- Offering [Assets](asset.md) to Contributors through [Payment Paths](payment-path.md)
- Being attributed to as a contributor because of their payments
- Participating in [Value Exchange](value-exchange.md) without requiring pre-existing agreements

Traders can offer assets to any type of Contributor, including other Traders, Talent Contributors, or Funders. Their offers:
- Can be partially or fully accepted
- Are priced independently of the attribution algorithm
- Include conditions to manage risk and value alignment
- Can form complex payment chains (e.g., through multiple traders)

The key distinction is that trades represent potential value rather than fixed assets:
- Actual value attribution is calculated at the time of attribution calculation
- Trades are recorded in the contribution table as value exchanges
- Final rewards are determined by the current snapshot of all contributions
- Unlike traditional securities, they represent virtual value transfers rather than fixed assets