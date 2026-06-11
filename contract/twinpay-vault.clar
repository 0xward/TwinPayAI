;; TwinPay Vault
;; Clarity 2 - Stacks Mainnet
;; Contract: SPQ189E66S20X7ATY7794HBY6743JE9YJMCKHAEF.twinpay-vault

(define-constant ERR-NOT-CONFIGURED (err u100))
(define-constant ERR-ZERO-AMOUNT (err u101))
(define-constant ERR-OVER-LIMIT (err u102))
(define-constant ERR-CAP-REACHED (err u103))
(define-constant ERR-PAUSED (err u104))
(define-constant ERR-TRANSFER-FAILED (err u105))

(define-constant WINDOW-BLOCKS u4320)

(define-map vaults principal
  { limit-ustx: uint, window-start: uint, spent: uint, active: bool }
)

(define-private (current-spent (vault { limit-ustx: uint, window-start: uint, spent: uint, active: bool }))
  (if (>= (- burn-block-height (get window-start vault)) WINDOW-BLOCKS)
    u0
    (get spent vault)
  )
)

(define-read-only (get-vault (owner principal))
  (map-get? vaults owner)
)

(define-read-only (get-remaining (owner principal))
  (match (map-get? vaults owner)
    vault
    (let ((spent (current-spent vault)))
      (ok (if (>= spent (get limit-ustx vault))
        u0
        (- (get limit-ustx vault) spent)
      ))
    )
    ERR-NOT-CONFIGURED
  )
)

(define-public (configure-vault (limit-ustx uint))
  (begin
    (asserts! (> limit-ustx u0) ERR-ZERO-AMOUNT)
    (map-set vaults tx-sender
      { limit-ustx: limit-ustx, window-start: burn-block-height, spent: u0, active: true }
    )
    (ok true)
  )
)

(define-public (set-active (active bool))
  (match (map-get? vaults tx-sender)
    vault
    (begin
      (map-set vaults tx-sender (merge vault { active: active }))
      (ok true)
    )
    ERR-NOT-CONFIGURED
  )
)

(define-public (execute-transfer (amount-ustx uint) (recipient principal))
  (let ((vault (unwrap! (map-get? vaults tx-sender) ERR-NOT-CONFIGURED)))
    (asserts! (get active vault) ERR-PAUSED)
    (asserts! (> amount-ustx u0) ERR-ZERO-AMOUNT)
    (asserts! (<= amount-ustx (get limit-ustx vault)) ERR-OVER-LIMIT)
    (let (
      (effective-spent (current-spent vault))
      (new-start (if (>= (- burn-block-height (get window-start vault)) WINDOW-BLOCKS)
        burn-block-height
        (get window-start vault)))
    )
      (asserts! (<= (+ effective-spent amount-ustx) (get limit-ustx vault)) ERR-CAP-REACHED)
      (unwrap! (stx-transfer? amount-ustx tx-sender recipient) ERR-TRANSFER-FAILED)
      (map-set vaults tx-sender
        (merge vault {
          window-start: new-start,
          spent: (+ effective-spent amount-ustx)
        })
      )
      (print {
        event: "transfer",
        sender: tx-sender,
        recipient: recipient,
        amount-ustx: amount-ustx,
        remaining: (- (get limit-ustx vault) (+ effective-spent amount-ustx))
      })
      (ok true)
    )
  )
)

(define-public (reset-window)
  (match (map-get? vaults tx-sender)
    vault
    (begin
      (map-set vaults tx-sender
        (merge vault { window-start: burn-block-height, spent: u0 })
      )
      (ok true)
    )
    ERR-NOT-CONFIGURED
  )
)
