# Identity

**Definition**: The representation of an [Actor](actor.md) within the platform, existing at different levels of verification through the Identity Verification process.

**Description**:

Identity encompasses multiple forms based on the level of verification:

1. **Basic Identity**:
   - Utilizes cryptographic keys for authentication.
   - Enables standard platform interactions.
   - No legal verification required.

2. **Enhanced Verification**:
   - Depends on services provided by the [Legal Gateway](legal-gateway.md).
   - May involve accepting click-through agreements or verifying valid credit cards.
   - Used for activities that may not involve regulated services.

3. **Full KYC Verification**:
   - Conducted through [KYC](kyc.md) processes using government-issued documents.
   - Required for activities involving regulated services or legal compliance.

The required level of identity verification depends on the services being accessed and compliance requirements.

**Related Concepts**:

- [Legal Gateway](legal-gateway.md)
- [KYC](kyc.md)
- [Regulatory Compliance](regulatory-compliance.md)
