//! Deterministic FIFO allocation for fuel inventory batches.

#[derive(Debug, Clone)]
pub struct FifoBatch {
    pub id: String,
    pub remaining_milli_litres: i64,
    pub unit_cost_minor_per_litre: i64,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct FifoConsumption {
    pub batch_id: String,
    pub quantity_milli_litres: i64,
    pub unit_cost_minor_per_litre: i64,
    pub cost_minor: i64,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum FifoError {
    InsufficientStock {
        available_milli: i64,
        requested_milli: i64,
    },
    InvalidQuantity,
}

impl FifoError {
    pub fn message(&self) -> String {
        match self {
            FifoError::InsufficientStock {
                available_milli,
                requested_milli,
            } => format!(
                "Insufficient stock. Available: {:.3} L, requested: {:.3} L.",
                *available_milli as f64 / 1000.0,
                *requested_milli as f64 / 1000.0
            ),
            FifoError::InvalidQuantity => "Quantity must be greater than zero.".to_string(),
        }
    }
}

pub fn allocate_fifo(
    batches: &[FifoBatch],
    quantity_milli_litres: i64,
) -> Result<Vec<FifoConsumption>, FifoError> {
    if quantity_milli_litres <= 0 {
        return Err(FifoError::InvalidQuantity);
    }

    let available: i64 = batches.iter().map(|b| b.remaining_milli_litres).sum();
    if available < quantity_milli_litres {
        return Err(FifoError::InsufficientStock {
            available_milli: available,
            requested_milli: quantity_milli_litres,
        });
    }

    let mut remaining = quantity_milli_litres;
    let mut consumptions = Vec::new();

    for batch in batches {
        if remaining <= 0 {
            break;
        }
        if batch.remaining_milli_litres <= 0 {
            continue;
        }

        let take = remaining.min(batch.remaining_milli_litres);
        let cost_minor = (take * batch.unit_cost_minor_per_litre) / 1000;
        consumptions.push(FifoConsumption {
            batch_id: batch.id.clone(),
            quantity_milli_litres: take,
            unit_cost_minor_per_litre: batch.unit_cost_minor_per_litre,
            cost_minor,
        });
        remaining -= take;
    }

    Ok(consumptions)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn consumes_earliest_batches_first() {
        let batches = vec![
            FifoBatch {
                id: "b1".to_string(),
                remaining_milli_litres: 5_000_000,
                unit_cost_minor_per_litre: 28000,
            },
            FifoBatch {
                id: "b2".to_string(),
                remaining_milli_litres: 3_000_000,
                unit_cost_minor_per_litre: 28500,
            },
        ];

        let result = allocate_fifo(&batches, 6_000_000).unwrap();
        assert_eq!(result.len(), 2);
        assert_eq!(result[0].batch_id, "b1");
        assert_eq!(result[0].quantity_milli_litres, 5_000_000);
        assert_eq!(result[1].batch_id, "b2");
        assert_eq!(result[1].quantity_milli_litres, 1_000_000);
    }

    #[test]
    fn rejects_insufficient_stock() {
        let batches = vec![FifoBatch {
            id: "b1".to_string(),
            remaining_milli_litres: 1000,
            unit_cost_minor_per_litre: 28000,
        }];

        assert!(matches!(
            allocate_fifo(&batches, 5000),
            Err(FifoError::InsufficientStock { .. })
        ));
    }
}
