export async function createCharge(input: { amount: number }): Promise<CreateChargeOutput> {
    const CC_COMMERCE_KEY = process.env.COINBASE_COMMERCE_KEY
    if (!CC_COMMERCE_KEY) {
        throw new Error("Require process.env.COINBASE_COMMERCE_KEY")
    }

    try {
        const headers = new Headers()
        headers.set("content-type", "application/json")
        headers.set("X-CC-Api-Key", CC_COMMERCE_KEY)
        headers.set("X-CC-Version", "2018-03-22")

        const result: CreateChargeOutput = await fetch("https://api.commerce.coinbase.com/charges", {
            body: JSON.stringify({
                name: "Asuna Credit",
                description: "Buy Asuna credits to play with accessories",
                pricing_type: "fixed_price",
                local_price: {
                    amount: input.amount.toFixed(2),
                    currency: "USD",
                },
                redirect_url: "https://asuna-demo.fly.dev/inventory",
                cancel_url: "https://asuna-demo.fly.dev/inventory",
            }),
            headers: headers,
            method: "post",
        }).then(r => r.json())

        return result
    } catch (err) {
        console.error("failed to create commerce charge", err)
        throw new Error("Bad Charge")
    }
}

type CreateChargeOutput = {
    data: {
        addresses: {
            ethereum: "0xef9f588f781174a11f6dd8fdecf733421edb9917"
            usdc: "0xef9f588f781174a11f6dd8fdecf733421edb9917"
            dai: "0xef9f588f781174a11f6dd8fdecf733421edb9917"
            bitcoin: "33zZUMABere6NUaQmhF4d9BANiMNsE17Uv"
        }
        brand_color: "#122332"
        brand_logo_url: ""
        cancel_url: "https://asuna-demo.fly.dev/credit/cancel"
        code: "EE8CHKXQ"
        created_at: "2022-06-03T03:06:31Z"
        description: "Buy Asuna credits to play with accessories"
        exchange_rates: {
            "ETH-USD": "1828.59"
            "BTC-USD": "30507.435"
            "USDC-USD": "1.0"
            "DAI-USD": "0.99965"
        }
        expires_at: "2022-06-03T04:06:30Z"
        fee_rate: 0.01
        fees_settled: true
        hosted_url: "https://commerce.coinbase.com/charges/EE8CHKXQ"
        id: "a7cac183-11f8-4f4f-b359-37c072fd466a"
        local_exchange_rates: {
            "ETH-USD": "1828.59"
            "BTC-USD": "30507.435"
            "USDC-USD": "1.0"
            "DAI-USD": "0.99965"
        }
        logo_url: ""
        metadata: {}
        name: "Asuna Credit"
        offchain_eligible: false
        organization_name: ""
        payment_threshold: {
            overpayment_absolute_threshold: {
                amount: "5.00"
                currency: "USD"
            }
            overpayment_relative_threshold: "0.005"
            underpayment_absolute_threshold: {
                amount: "5.00"
                currency: "USD"
            }
            underpayment_relative_threshold: "0.005"
        }
        payments: []
        pricing: {
            local: {
                amount: "1.00"
                currency: "USD"
            }
            ethereum: {
                amount: "0.000547000"
                currency: "ETH"
            }
            usdc: {
                amount: "1.000000"
                currency: "USDC"
            }
            dai: {
                amount: "1.000350123000000000"
                currency: "DAI"
            }
            bitcoin: {
                amount: "0.00003278"
                currency: "BTC"
            }
        }
        pricing_type: "fixed_price"
        pwcb_only: false
        redirect_url: "https://asuna-demo.fly.dev/credit/success"
        resource: "charge"
        support_email: "dennis.dang@hey.com"
        timeline: [
            {
                status: "NEW"
                time: "2022-06-03T03:06:31Z"
            }
        ]
        utxo: false
    }
}
