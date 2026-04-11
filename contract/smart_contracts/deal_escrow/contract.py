from algopy import (
    ARC4Contract,
    Global,
    GlobalState,
    Txn,
    UInt64,
    arc4,
    gtxn,
    itxn,
)


class DealEscrow(ARC4Contract):
    # status: 0=empty, 1=created, 2=funded, 3=verified, 4=released, 5=refunded

    def __init__(self) -> None:
        self.buyer = GlobalState(arc4.Address())
        self.seller = GlobalState(arc4.Address())
        self.amount = GlobalState(UInt64(0))
        self.deadline = GlobalState(UInt64(0))
        self.status = GlobalState(UInt64(0))
        self.verified = GlobalState(UInt64(0))

    @arc4.abimethod()
    def createDeal(
        self,
        buyer: arc4.Address,
        seller: arc4.Address,
        amount: arc4.UInt64,
        deadline: arc4.UInt64,
    ) -> None:
        assert self.status.value == UInt64(0), "Deal already exists"
        self.buyer.value = buyer
        self.seller.value = seller
        self.amount.value = amount.native
        self.deadline.value = deadline.native
        self.status.value = UInt64(1)
        self.verified.value = UInt64(0)

    @arc4.abimethod()
    def fundDeal(self, payment: gtxn.PaymentTransaction) -> None:
        assert self.status.value == UInt64(1), "Deal not in created state"
        assert payment.receiver == Global.current_application_address, "Payment must be to app"
        assert payment.amount >= self.amount.value, "Insufficient payment"
        assert Txn.sender == self.buyer.value.native, "Only buyer can fund"
        self.status.value = UInt64(2)

    @arc4.abimethod()
    def verifyComplete(self) -> None:
        assert self.status.value == UInt64(2), "Deal not funded"
        self.verified.value = UInt64(1)
        self.status.value = UInt64(3)

    @arc4.abimethod()
    def releaseFunds(self) -> None:
        assert self.status.value == UInt64(3), "Deal not verified"
        assert self.verified.value == UInt64(1), "Not verified"
        itxn.Payment(
            receiver=self.seller.value.native,
            amount=self.amount.value,
            fee=UInt64(0),
        ).submit()
        self.status.value = UInt64(4)

    @arc4.abimethod()
    def refundBuyer(self) -> None:
        assert self.status.value == UInt64(2), "Deal not in funded state"
        itxn.Payment(
            receiver=self.buyer.value.native,
            amount=self.amount.value,
            fee=UInt64(0),
        ).submit()
        self.status.value = UInt64(5)
