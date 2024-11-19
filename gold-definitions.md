# Dreamcatcher Network Reference Definitions

### Dream Catcher Platform
**Definition**: An open-source, decentralized platform designed for collaborative creation, sharing, and execution of [NApps](#napp-natural-language-application).

**Description**: The Dream Catcher Platform enables [Actors](#actor) to participate in a unified ecosystem where they can contribute resources, develop NApps, and interact with others. It emphasizes Actor sovereignty, portability, and interoperability across multiple hosts and platforms. The platform operates on shared [Protocols](#protocol), allowing Actors to migrate or replicate their data and applications seamlessly between different instances. Platform instances can range from large-scale deployments to individual [Homebrew Platforms](#homebrew-platform).

### Actor
**Definition**: A participant within the [Dream Catcher Platform](#dream-catcher-platform) that engages with the platform's services and resources.

**Hierarchy**:
1. Service Provider
   - Issuer: Creates and manages [Assets](#asset)
   - Legal Gateway Operator: Bridges platform and real-world systems
   - Infrastructure Provider: Offers computational resources
   - Platform Operator: Manages platform instances
2. Talent
   - Developer: Creates and maintains [NApps](#napp-natural-language-application)
   - Content Creator: Produces digital content
   - Expert: Provides specialized knowledge or services
3. Consumer
   - NApp User: Utilizes platform applications
   - Service User: Consumes platform services
4. Demander
   - Project Initiator: Starts new ventures
   - Resource Requester: Seeks specific platform resources
5. Trader
   - Asset Trader: Facilitates asset exchanges
   - Market Maker: Provides liquidity
6. Funder
   - Project Backer: Supports specific initiatives
   - Infrastructure Investor: Funds platform development

**Description**: Actors can simultaneously fulfill multiple roles within the ecosystem. Their activities and contributions are tracked through various [Attribution Algorithms](#attribution-algorithm), enabling fair recognition and compensation. Each Actor type has specific rights, responsibilities, and interaction patterns within the platform.

### Alpha Network
**Definition**: An illustrative example of a [Platform Instance](#platform-instance) demonstrating cross-jurisdictional operation and Legal Gateway integration.

**Description**: Alpha Network serves as a conceptual example showing how:
- Platform instances can operate across different legal jurisdictions
- [Legal Gateways](#legal-gateway) can bridge multiple regulatory frameworks
- [Assets](#asset) can be issued and traded across borders
- [Actors](#actor) can maintain sovereignty while participating in a global ecosystem
This example helps explain complex platform concepts in practical terms.

### Beta Network
**Definition**: A hypothetical example of a large-scale [Platform Instance](#platform-instance) demonstrating advanced service provision and infrastructure capabilities.

**Description**: Beta Network illustrates:
- Operation of multiple [Legal Gateways](#legal-gateway)
- Sophisticated [Asset](#asset) issuance and management
- Complex [Attribution Algorithm](#attribution-algorithm) implementations
- Integration of various [Service Provider](#service-provider) types
This example demonstrates how enterprise-scale platform instances can operate while maintaining decentralization principles.

### Legal Gateway Relationships
**Definition**: The interconnected system of relationships between [Legal Gateways](#legal-gateway), real-world [Legal Entities](#legal-entity), and platform [Actors](#actor).

**Description**: Legal Gateways maintain several key relationships:
1. With Legal Entities:
   - Act as authorized representatives
   - Handle regulatory compliance
   - Manage legal documentation
2. With Platform Actors:
   - Provide identity verification services
   - Enable fiat currency transactions
   - Issue regulated Assets
3. With Other Legal Gateways:
   - Coordinate cross-jurisdictional activities
   - Share compliance information
   - Facilitate international transactions
These relationships enable seamless interaction between the decentralized platform and traditional legal/financial systems.

### Ambient Attribution
**Definition**: A specific type of [Attribution Algorithm](#attribution-algorithm) that provides decentralized, automatic tracking and rewarding of [Contributions](#contribution).

**Description**: Ambient Attribution represents an advanced form of attribution that eliminates the need for traditional methods of tracking contributions, such as cap tables or manual accounting. It operates autonomously across decentralized platform instances, ensuring contributions are tracked globally and rewards are distributed fairly without central oversight.

### Asset
**Definition**: An item of value that can be transferred or exchanged on the platform, created and distributed by Issuers (a subclass of [Service Provider](#service-provider)).

**Description**: Assets are used for payments, rewards, and exchanges between [Actors](#actor). They can be digital currencies, fiat currencies (issued through [Legal Gateways](#legal-gateway)), platform credits, or any form of value recognized within the platform. Different Issuers can provide various classes of assets - for example, a Service Provider operating a Stripe-based Legal Gateway can issue fiat currency-backed assets.

### Attribution Algorithm
**Definition**: A system that calculates the [Contributions](#contribution) of [Actors](#actor) to projects or services, determining the distribution of rewards or recognition. Multiple types of attribution algorithms can exist within the platform.

**Description**: Attribution Algorithms can take various forms, from traditional corporate schemes (like employee stock option plans) to automated, decentralized systems like [Ambient Attribution](#ambient-attribution). These algorithms process recorded contributions to assign value or credit to actors appropriately, with different methods suited to different contexts and requirements.

### Legal Gateway
**Definition**: An entity that exists both as a real-world [Legal Entity](#legal-entity) and as a Dream Catcher Platform entity, facilitating interactions between the decentralized platform and traditional institutions.

**Description**: Legal Gateways provide essential services such as [Identity](#identity) verification, payment processing, and interfacing with real-world legal entities. They handle compliance requirements such as [KYC](#kyc-know-your-customer) processes and enable Actors to engage with traditional financial systems and regulated services. For example, a Legal Gateway might operate as both a registered company in the real world and a Service Provider within the platform, enabling fiat currency transactions through services like Stripe.

### Hosting
**Definition**: The provision and operation of computational resources and infrastructure necessary to run Dream Catcher Platform instances and services.

**Description**: Hosting can be provided by various [Actors](#actor), from large organizations to individuals running [Homebrew Platforms](#homebrew-platforms). Hosts maintain their infrastructure and may establish policies or terms of service that align with their operational models and legal obligations. While [Service Providers](#service-provider) may offer hosting services, hosting itself refers specifically to the operation of platform instances.

### Identity
**Definition**: The representation of an [Actor](#actor) within the platform, existing at different levels of verification.

**Description**: Identity exists in two primary forms:
1. Basic Identity: Using cryptographic keys for authentication and platform interaction
2. Verified Identity: Enhanced through [KYC](#kyc-know-your-customer) processes via [Legal Gateways](#legal-gateway)
The level of identity verification required depends on the services being used and compliance requirements.

### KYC (Know Your Customer)
**Definition**: A verification process conducted through [Legal Gateways](#legal-gateway) to confirm the real-world identity of [Actors](#actor).

**Description**: KYC processes are required when Actors need to interact with regulated services or traditional institutions, such as handling fiat currency transactions. This verification adds a layer of legal identity confirmation beyond the platform's basic [Identity](#identity) mechanisms and is facilitated by Legal Gateways that bridge the platform and real-world legal requirements.

### Legal Entity
**Definition**: A real-world organization recognized by law that can enter into contracts, own assets, and be held liable.

**Description**: Legal Entities exist independently of the Dream Catcher Platform but interact with it through [Legal Gateways](#legal-gateway). They enable formal business operations, regulatory compliance, and interaction with traditional financial systems. Legal Entities may be necessary for certain platform activities, particularly those involving regulated services or fiat currency transactions.

### NApp (Natural language Application)
**Definition**: A modular application or service that can be discovered, shared, and executed within the Dream Catcher ecosystem.

**Description**: NApps are the fundamental functional units on the platform, developed and utilized by [Actors](#actor). They perform various tasks and can be combined or orchestrated to create complex services. NApps are designed to be interoperable, allowing them to operate across different platforms and hosts, fostering collaboration and innovation.

### NApp Discovery
**Definition**: The process through which [Actors](#actor) find and access [NApps](#napp-natural-language-application) available on the platform.

**Description**: NApp Discovery operates through decentralized mechanisms enabled by shared [Protocols](#protocol). The discovery process ensures that NApps are visible and accessible across different hosts and platforms, promoting interoperability and innovation. Search algorithms and distributed registries facilitate the discovery process while maintaining the platform's decentralized nature.

### Payment Path
**Definition**: The mechanisms and routes through which [Assets](#asset) are transferred between [Actors](#actor) on the platform.

**Description**: Payment Paths determine how Assets move through the platform, including transfers through [Legal Gateways](#legal-gateway) for fiat currency transactions. They may involve multiple steps or conversions, especially when different Asset types are used between parties. Payment Paths are essential for facilitating [Decentralized Income](#decentralized-income) and other economic activities within the ecosystem.

### Platform
**Definition**: Any instance running the Dream Catcher software, whether operated by an organization or individual [Actors](#actor).

**Description**: Platforms can range from large-scale deployments to [Homebrew Platforms](#homebrew-platforms) running on personal hardware. All platforms, regardless of size or operator, are equal participants in the ecosystem when they adhere to the established [Protocols](#protocol). Multiple platforms operate in [Consensus Mode](#consensus-mode) to maintain synchronization and data consistency across the network.

### Protocol
**Definition**: A set of standardized rules and procedures that govern data formatting, transmission, and processing within the Dream Catcher ecosystem.

**Description**: Protocols ensure interoperability between different platform instances and [Actors](#actor). They define standards for API interactions, data exchange formats, and communication methods. Adherence to these protocols enables seamless interaction across the decentralized network while maintaining security and consistency. Protocols are fundamental to the platform's ability to function as a unified ecosystem despite its decentralized nature.

### Service Provider
**Definition**: A type of [Actor](#actor) that offers services or resources to other Actors on the platform, including but not limited to computational resources, specialized functionalities, or Asset issuance.

**Description**: Service Providers can operate in various capacities:
- As Issuers creating and distributing [Assets](#asset)
- As operators of [Legal Gateways](#legal-gateway)
- As providers of specialized services or [NApps](#napp-natural-language-application)
They play a crucial role in expanding the platform's capabilities and services while maintaining its decentralized nature.

### Consensus Mode
**Definition**: An operational state where multiple platform instances synchronize data and operations using consensus algorithms.

**Description**: Consensus Mode ensures consistency across the decentralized network through established protocols and algorithms. This mode enables:
- Synchronized state across different hosts
- Reliable data consistency
- Fault tolerance
- Enhanced security
- Seamless interaction between [Actors](#actor) across different platform instances
The consensus mechanisms support the platform's decentralized nature while maintaining operational integrity.

### Homebrew Platform
**Definition**: An instance of the Dream Catcher Platform set up and operated by individual [Actors](#actor) or small groups, typically running on personal hardware.

**Description**: Homebrew Platforms contribute to the ecosystem's decentralization by diversifying hosting sources. They operate as full participants in the network when adhering to platform [Protocols](#protocol), enabling their operators to maintain sovereignty while participating in the broader ecosystem. These platforms can run in [Consensus Mode](#consensus-mode) with other instances to maintain network synchronization.

### Decentralized Income
**Definition**: Income generated and distributed through decentralized mechanisms within the platform, based on [Contributions](#contribution) recognized by [Attribution Algorithms](#attribution-algorithm).

**Description**: Decentralized Income flows through the platform as [Assets](#asset) issued by Service Providers, distributed according to contribution calculations. The distribution occurs through [Payment Paths](#payment-path) without requiring centralized intermediaries. This system enables fair compensation for platform contributions while maintaining the decentralized nature of the ecosystem.

### Contribution
**Definition**: Any valuable input provided by an [Actor](#actor) to the platform ecosystem, which can be recognized and rewarded through [Attribution Algorithms](#attribution-algorithm).

**Description**: Contributions can take many forms:
- Development of [NApps](#napp-natural-language-application)
- Provision of computational resources
- Creative work or expertise
- Platform maintenance and improvement
- Community support and engagement
These contributions are tracked and valued through various attribution methods, from traditional corporate schemes to [Ambient Attribution](#ambient-attribution).

### Identity Verification
**Definition**: The process of confirming an [Actor's](#actor) identity through various means, from basic cryptographic verification to full [KYC](#kyc-know-your-customer) processes.

**Description**: Identity verification occurs at different levels depending on the activities being performed:
- Basic verification uses cryptographic keys for standard platform interactions
- Enhanced verification through [Legal Gateways](#legal-gateway) for regulated activities
- Full KYC verification for activities requiring legal compliance
The level of verification required is determined by the nature of the services being accessed and regulatory requirements.

### Issuer
**Definition**: A subclass of [Service Provider](#service-provider) that creates and distributes [Assets](#asset) within the platform.

**Description**: Issuers play a crucial role in the platform's economic system by:
- Creating various classes of Assets
- Managing Asset distribution
- Maintaining Asset backing (such as fiat currency reserves)
- Ensuring compliance through [Legal Gateways](#legal-gateway) when necessary
Examples include Service Providers operating Stripe-based gateways for fiat currency issuance or platforms issuing their own credit systems.

### Platform Instance
**Definition**: A specific deployment of the Dream Catcher Platform software, whether operated as a [Homebrew Platform](#homebrew-platform) or by a larger organization.

**Description**: Platform instances operate independently while maintaining synchronization through [Consensus Mode](#consensus-mode). Each instance:
- Adheres to common [Protocols](#protocol)
- Participates in the broader ecosystem
- Can host and execute [NApps](#napp-natural-language-application)
- Maintains connections with other instances
Together, these instances form the decentralized network that powers the Dream Catcher ecosystem.

### Regulatory Compliance
**Definition**: Adherence to legal and regulatory requirements through [Legal Gateways](#legal-gateway) and appropriate identity verification processes.

**Description**: Regulatory compliance is managed through:
- [KYC](#kyc-know-your-customer) processes for regulated activities
- Legal Gateway services for traditional financial system interactions
- Appropriate [Identity](#identity) verification levels
- Proper handling of regulated [Assets](#asset)
This ensures the platform can interface with traditional systems while maintaining its decentralized nature where possible.

### Value Exchange
**Definition**: The transfer of [Assets](#asset) between [Actors](#actor) through established [Payment Paths](#payment-path).

**Description**: Value exchange within the platform encompasses:
- Direct Asset transfers between Actors
- Compensation for contributions
- Service payments
- Asset conversions through Legal Gateways
These exchanges are facilitated by the platform's protocols and payment mechanisms, ensuring secure and efficient transfer of value across the ecosystem.
