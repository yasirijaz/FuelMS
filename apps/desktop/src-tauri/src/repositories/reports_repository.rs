use rusqlite::params;

use crate::db::connection::DbConnection;
use crate::dto::reports::{
    CashPositionLineDto, CashPositionReportDto, CommandErrorDto, FuelProductLedgerLineDto,
    FuelProductLedgerProductDto, FuelProductLedgerReportDto, FuelSalesSummaryLineDto,
    FuelSalesSummaryReportDto, PersonBalanceLineDto, PersonLedgerSummaryReportDto,
    ProfitLossReportDto, ReportDateRangeQueryDto, TrialBalanceLineDto, TrialBalanceReportDto,
};

pub struct ReportsRepository<'a> {
    db: &'a DbConnection,
}

impl<'a> ReportsRepository<'a> {
    pub fn new(db: &'a DbConnection) -> Self {
        Self { db }
    }

    pub fn profit_loss(
        &self,
        query: &ReportDateRangeQueryDto,
    ) -> Result<ProfitLossReportDto, CommandErrorDto> {
        Self::validate_date_range(query)?;
        let conn = self.db.conn();

        let sales: (i64, i64, i64) = conn
            .query_row(
                "SELECT COALESCE(SUM(total_revenue_minor), 0),
                        COALESCE(SUM(total_cogs_minor), 0),
                        COUNT(*)
                 FROM fuel_sales
                 WHERE status = 'posted'
                   AND date(sale_date) >= date(?1)
                   AND date(sale_date) <= date(?2)",
                params![query.from_date_iso, query.to_date_iso],
                |row| Ok((row.get(0)?, row.get(1)?, row.get(2)?)),
            )
            .map_err(|e| db_error("DB_QUERY_FAILED", &e.to_string()))?;

        let expenses: (i64, i64) = conn
            .query_row(
                "SELECT COALESCE(SUM(amount_minor), 0), COUNT(*)
                 FROM operating_expenses
                 WHERE status = 'posted'
                   AND date(expense_date) >= date(?1)
                   AND date(expense_date) <= date(?2)",
                params![query.from_date_iso, query.to_date_iso],
                |row| Ok((row.get(0)?, row.get(1)?)),
            )
            .map_err(|e| db_error("DB_QUERY_FAILED", &e.to_string()))?;

        let income: (i64, i64) = conn
            .query_row(
                "SELECT COALESCE(SUM(amount_minor), 0), COUNT(*)
                 FROM operating_income
                 WHERE status = 'posted'
                   AND date(income_date) >= date(?1)
                   AND date(income_date) <= date(?2)",
                params![query.from_date_iso, query.to_date_iso],
                |row| Ok((row.get(0)?, row.get(1)?)),
            )
            .map_err(|e| db_error("DB_QUERY_FAILED", &e.to_string()))?;

        let gross_profit = sales.0 - sales.1;
        let net_operating = gross_profit + income.0 - expenses.0;

        Ok(ProfitLossReportDto {
            from_date_iso: query.from_date_iso.clone(),
            to_date_iso: query.to_date_iso.clone(),
            fuel_sales_revenue_minor: sales.0,
            fuel_cogs_minor: sales.1,
            gross_profit_minor: gross_profit,
            other_income_minor: income.0,
            operating_expenses_minor: expenses.0,
            net_operating_profit_minor: net_operating,
            posted_sale_count: sales.2,
            posted_expense_count: expenses.1,
            posted_income_count: income.1,
        })
    }

    pub fn fuel_sales_summary(
        &self,
        query: &ReportDateRangeQueryDto,
    ) -> Result<FuelSalesSummaryReportDto, CommandErrorDto> {
        Self::validate_date_range(query)?;
        let conn = self.db.conn();

        let mut stmt = conn
            .prepare(
                "SELECT fp.code AS product_code,
                        COUNT(*) AS sale_count,
                        COALESCE(SUM(fs.quantity_milli_litres), 0) AS quantity_milli_litres,
                        COALESCE(SUM(fs.total_revenue_minor), 0) AS revenue_minor,
                        COALESCE(SUM(fs.total_cogs_minor), 0) AS cogs_minor
                 FROM fuel_sales fs
                 INNER JOIN fuel_products fp ON fp.id = fs.product_id
                 WHERE fs.status = 'posted'
                   AND date(fs.sale_date) >= date(?1)
                   AND date(fs.sale_date) <= date(?2)
                 GROUP BY fp.code
                 ORDER BY fp.code ASC",
            )
            .map_err(|e| db_error("DB_PREPARE_FAILED", &e.to_string()))?;

        let lines = stmt
            .query_map(params![query.from_date_iso, query.to_date_iso], |row| {
                let revenue: i64 = row.get("revenue_minor")?;
                let cogs: i64 = row.get("cogs_minor")?;
                Ok(FuelSalesSummaryLineDto {
                    product_code: row.get("product_code")?,
                    sale_count: row.get("sale_count")?,
                    quantity_milli_litres: row.get("quantity_milli_litres")?,
                    revenue_minor: revenue,
                    cogs_minor: cogs,
                    gross_profit_minor: revenue - cogs,
                })
            })
            .map_err(|e| db_error("DB_QUERY_FAILED", &e.to_string()))?
            .collect::<Result<Vec<_>, _>>()
            .map_err(|e| db_error("DB_ROW_MAP_FAILED", &e.to_string()))?;

        let total_revenue: i64 = lines.iter().map(|l| l.revenue_minor).sum();
        let total_cogs: i64 = lines.iter().map(|l| l.cogs_minor).sum();

        Ok(FuelSalesSummaryReportDto {
            from_date_iso: query.from_date_iso.clone(),
            to_date_iso: query.to_date_iso.clone(),
            total_revenue_minor: total_revenue,
            total_cogs_minor: total_cogs,
            total_gross_profit_minor: total_revenue - total_cogs,
            lines,
        })
    }

    pub fn cash_position(&self) -> Result<CashPositionReportDto, CommandErrorDto> {
        let conn = self.db.conn();
        let mut stmt = conn
            .prepare(
                "SELECT id, name, account_type, balance_minor
                 FROM cash_accounts
                 WHERE is_active = 1
                 ORDER BY display_order ASC, name ASC",
            )
            .map_err(|e| db_error("DB_PREPARE_FAILED", &e.to_string()))?;

        let lines = stmt
            .query_map([], |row| {
                Ok(CashPositionLineDto {
                    account_id: row.get("id")?,
                    account_name: row.get("name")?,
                    account_type: row.get("account_type")?,
                    balance_minor: row.get("balance_minor")?,
                })
            })
            .map_err(|e| db_error("DB_QUERY_FAILED", &e.to_string()))?
            .collect::<Result<Vec<_>, _>>()
            .map_err(|e| db_error("DB_ROW_MAP_FAILED", &e.to_string()))?;

        let total: i64 = lines.iter().map(|l| l.balance_minor).sum();

        Ok(CashPositionReportDto {
            as_of_iso: chrono::Utc::now().to_rfc3339_opts(chrono::SecondsFormat::Millis, true),
            total_balance_minor: total,
            lines,
        })
    }

    pub fn person_ledger_summary(&self) -> Result<PersonLedgerSummaryReportDto, CommandErrorDto> {
        let conn = self.db.conn();
        let mut stmt = conn
            .prepare(
                "SELECT bp.id AS partner_id, bp.display_name AS partner_name,
                        COALESCE(SUM(CASE WHEN ple.status = 'posted' THEN ple.signed_amount_minor ELSE 0 END), 0) AS balance_minor,
                        COUNT(CASE WHEN ple.status = 'posted' THEN ple.id END) AS entry_count
                 FROM business_partners bp
                 LEFT JOIN person_ledger_entries ple ON ple.partner_id = bp.id
                 WHERE bp.deleted_at IS NULL
                 GROUP BY bp.id, bp.display_name
                 HAVING balance_minor != 0
                 ORDER BY ABS(balance_minor) DESC, bp.display_name ASC",
            )
            .map_err(|e| db_error("DB_PREPARE_FAILED", &e.to_string()))?;

        let lines = stmt
            .query_map([], |row| {
                Ok(PersonBalanceLineDto {
                    partner_id: row.get("partner_id")?,
                    partner_name: row.get("partner_name")?,
                    balance_minor: row.get("balance_minor")?,
                    entry_count: row.get("entry_count")?,
                })
            })
            .map_err(|e| db_error("DB_QUERY_FAILED", &e.to_string()))?
            .collect::<Result<Vec<_>, _>>()
            .map_err(|e| db_error("DB_ROW_MAP_FAILED", &e.to_string()))?;

        let mut receivable = 0_i64;
        let mut payable = 0_i64;
        for line in &lines {
            if line.balance_minor > 0 {
                receivable += line.balance_minor;
            } else {
                payable += line.balance_minor.abs();
            }
        }

        Ok(PersonLedgerSummaryReportDto {
            as_of_iso: chrono::Utc::now().to_rfc3339_opts(chrono::SecondsFormat::Millis, true),
            receivable_total_minor: receivable,
            payable_total_minor: payable,
            lines,
        })
    }

    pub fn trial_balance(&self) -> Result<TrialBalanceReportDto, CommandErrorDto> {
        let conn = self.db.conn();
        let mut stmt = conn
            .prepare(
                "SELECT la.code, la.name, la.account_type, la.normal_balance,
                        CASE la.normal_balance
                          WHEN 'debit' THEN COALESCE(SUM(jl.debit_minor), 0) - COALESCE(SUM(jl.credit_minor), 0)
                          ELSE COALESCE(SUM(jl.credit_minor), 0) - COALESCE(SUM(jl.debit_minor), 0)
                        END AS balance_minor
                 FROM ledger_accounts la
                 LEFT JOIN journal_lines jl ON jl.account_id = la.id
                 LEFT JOIN journal_entries je ON je.id = jl.entry_id AND je.posting_status = 'posted'
                 WHERE la.is_active = 1 AND la.parent_id IS NOT NULL
                 GROUP BY la.id
                 HAVING balance_minor != 0
                 ORDER BY la.display_order ASC, la.code ASC",
            )
            .map_err(|e| db_error("DB_PREPARE_FAILED", &e.to_string()))?;

        let lines = stmt
            .query_map([], |row| {
                Ok(TrialBalanceLineDto {
                    account_code: row.get("code")?,
                    account_name: row.get("name")?,
                    account_type: row.get("account_type")?,
                    balance_minor: row.get("balance_minor")?,
                })
            })
            .map_err(|e| db_error("DB_QUERY_FAILED", &e.to_string()))?
            .collect::<Result<Vec<_>, _>>()
            .map_err(|e| db_error("DB_ROW_MAP_FAILED", &e.to_string()))?;

        let mut total_debit = 0_i64;
        let mut total_credit = 0_i64;
        for line in &lines {
            if line.balance_minor >= 0 {
                if line.account_type == "asset" || line.account_type == "expense" {
                    total_debit += line.balance_minor;
                } else {
                    total_credit += line.balance_minor;
                }
            } else {
                let abs = line.balance_minor.abs();
                if line.account_type == "asset" || line.account_type == "expense" {
                    total_credit += abs;
                } else {
                    total_debit += abs;
                }
            }
        }

        Ok(TrialBalanceReportDto {
            as_of_iso: chrono::Utc::now().to_rfc3339_opts(chrono::SecondsFormat::Millis, true),
            total_debit_minor: total_debit,
            total_credit_minor: total_credit,
            is_balanced: total_debit == total_credit,
            lines,
        })
    }

    pub fn fuel_product_ledger(
        &self,
        query: &ReportDateRangeQueryDto,
    ) -> Result<FuelProductLedgerReportDto, CommandErrorDto> {
        Self::validate_date_range(query)?;
        let conn = self.db.conn();

        let all_time_gross_profit_minor: i64 = conn
            .query_row(
                "SELECT COALESCE(SUM(total_revenue_minor - total_cogs_minor), 0)
                 FROM fuel_sales
                 WHERE status = 'posted'",
                [],
                |row| row.get(0),
            )
            .map_err(|e| db_error("DB_QUERY_FAILED", &e.to_string()))?;

        let period_gross_profit_minor: i64 = conn
            .query_row(
                "SELECT COALESCE(SUM(total_revenue_minor - total_cogs_minor), 0)
                 FROM fuel_sales
                 WHERE status = 'posted'
                   AND date(sale_date) >= date(?1)
                   AND date(sale_date) <= date(?2)",
                params![query.from_date_iso, query.to_date_iso],
                |row| row.get(0),
            )
            .map_err(|e| db_error("DB_QUERY_FAILED", &e.to_string()))?;

        let mut product_codes = conn
            .prepare(
                "SELECT code FROM fuel_products WHERE is_active = 1 ORDER BY display_order ASC, code ASC",
            )
            .map_err(|e| db_error("DB_PREPARE_FAILED", &e.to_string()))?
            .query_map([], |row| row.get::<_, String>(0))
            .map_err(|e| db_error("DB_QUERY_FAILED", &e.to_string()))?
            .collect::<Result<Vec<_>, _>>()
            .map_err(|e| db_error("DB_ROW_MAP_FAILED", &e.to_string()))?;

        if product_codes.is_empty() {
            product_codes = vec![
                "diesel".to_string(),
                "petrol".to_string(),
                "hobc".to_string(),
            ];
        }

        let mut products = Vec::new();
        for product_code in product_codes {
            products.push(self.load_product_ledger(&conn, &product_code, query)?);
        }

        Ok(FuelProductLedgerReportDto {
            from_date_iso: query.from_date_iso.clone(),
            to_date_iso: query.to_date_iso.clone(),
            period_gross_profit_minor,
            all_time_gross_profit_minor,
            products,
        })
    }

    fn load_product_ledger(
        &self,
        conn: &rusqlite::Connection,
        product_code: &str,
        query: &ReportDateRangeQueryDto,
    ) -> Result<FuelProductLedgerProductDto, CommandErrorDto> {
        let stock_milli_litres: i64 = conn
            .query_row(
                "SELECT COALESCE(SUM(b.remaining_milli_litres), 0)
                 FROM fuel_inventory_batches b
                 INNER JOIN fuel_products p ON p.id = b.product_id
                 WHERE p.code = ?1",
                params![product_code],
                |row| row.get(0),
            )
            .map_err(|e| db_error("DB_QUERY_FAILED", &e.to_string()))?;

        let (all_time_revenue_minor, all_time_cogs_minor): (i64, i64) = conn
            .query_row(
                "SELECT COALESCE(SUM(fs.total_revenue_minor), 0),
                        COALESCE(SUM(fs.total_cogs_minor), 0)
                 FROM fuel_sales fs
                 INNER JOIN fuel_products p ON p.id = fs.product_id
                 WHERE fs.status = 'posted' AND p.code = ?1",
                params![product_code],
                |row| Ok((row.get(0)?, row.get(1)?)),
            )
            .map_err(|e| db_error("DB_QUERY_FAILED", &e.to_string()))?;

        let (period_revenue_minor, period_cogs_minor): (i64, i64) = conn
            .query_row(
                "SELECT COALESCE(SUM(fs.total_revenue_minor), 0),
                        COALESCE(SUM(fs.total_cogs_minor), 0)
                 FROM fuel_sales fs
                 INNER JOIN fuel_products p ON p.id = fs.product_id
                 WHERE fs.status = 'posted'
                   AND p.code = ?1
                   AND date(fs.sale_date) >= date(?2)
                   AND date(fs.sale_date) <= date(?3)",
                params![product_code, query.from_date_iso, query.to_date_iso],
                |row| Ok((row.get(0)?, row.get(1)?)),
            )
            .map_err(|e| db_error("DB_QUERY_FAILED", &e.to_string()))?;

        let mut stmt = conn
            .prepare(
                "SELECT occurred_at_iso, kind, reference_id, label, notes, status,
                        quantity_milli_litres, money_in_minor, money_out_minor, gross_profit_minor
                 FROM (
                   SELECT fp.purchase_date AS occurred_at_iso,
                          'purchase' AS kind,
                          fp.id AS reference_id,
                          COALESCE('Purchase · ' || bp.display_name, 'Fuel purchase') AS label,
                          fp.notes AS notes,
                          fp.status AS status,
                          fp.quantity_milli_litres,
                          0 AS money_in_minor,
                          fp.total_cost_minor AS money_out_minor,
                          0 AS gross_profit_minor
                   FROM fuel_purchases fp
                   INNER JOIN fuel_products p ON p.id = fp.product_id
                   LEFT JOIN business_partners bp ON bp.id = fp.supplier_partner_id
                   WHERE fp.status IN ('draft', 'posted')
                     AND p.code = ?1
                     AND date(fp.purchase_date) >= date(?2)
                     AND date(fp.purchase_date) <= date(?3)
                   UNION ALL
                   SELECT fs.sale_date AS occurred_at_iso,
                          'sale' AS kind,
                          fs.id AS reference_id,
                          COALESCE('Sale · ' || bp.display_name, 'Fuel sale') AS label,
                          fs.notes AS notes,
                          fs.status AS status,
                          fs.quantity_milli_litres,
                          fs.total_revenue_minor AS money_in_minor,
                          fs.total_cogs_minor AS money_out_minor,
                          fs.total_revenue_minor - fs.total_cogs_minor AS gross_profit_minor
                   FROM fuel_sales fs
                   INNER JOIN fuel_products p ON p.id = fs.product_id
                   LEFT JOIN business_partners bp ON bp.id = fs.customer_partner_id
                   WHERE fs.status IN ('draft', 'posted')
                     AND p.code = ?1
                     AND date(fs.sale_date) >= date(?2)
                     AND date(fs.sale_date) <= date(?3)
                 )
                 ORDER BY occurred_at_iso ASC, kind ASC",
            )
            .map_err(|e| db_error("DB_PREPARE_FAILED", &e.to_string()))?;

        let lines = stmt
            .query_map(
                params![product_code, query.from_date_iso, query.to_date_iso],
                |row| {
                    Ok(FuelProductLedgerLineDto {
                        occurred_at_iso: row.get("occurred_at_iso")?,
                        kind: row.get("kind")?,
                        reference_id: row.get("reference_id")?,
                        label: row.get("label")?,
                        notes: row.get("notes")?,
                        status: row.get("status")?,
                        quantity_milli_litres: row.get("quantity_milli_litres")?,
                        money_in_minor: row.get("money_in_minor")?,
                        money_out_minor: row.get("money_out_minor")?,
                        gross_profit_minor: row.get("gross_profit_minor")?,
                    })
                },
            )
            .map_err(|e| db_error("DB_QUERY_FAILED", &e.to_string()))?
            .collect::<Result<Vec<_>, _>>()
            .map_err(|e| db_error("DB_ROW_MAP_FAILED", &e.to_string()))?;

        Ok(FuelProductLedgerProductDto {
            product_code: product_code.to_string(),
            stock_milli_litres,
            period_revenue_minor,
            period_cogs_minor,
            period_gross_profit_minor: period_revenue_minor - period_cogs_minor,
            all_time_revenue_minor,
            all_time_cogs_minor,
            all_time_gross_profit_minor: all_time_revenue_minor - all_time_cogs_minor,
            lines,
        })
    }

    fn validate_date_range(query: &ReportDateRangeQueryDto) -> Result<(), CommandErrorDto> {
        if query.from_date_iso.trim().is_empty() || query.to_date_iso.trim().is_empty() {
            return Err(conflict(
                "DATE_RANGE_REQUIRED",
                "From and to dates are required.",
            ));
        }
        let from = query
            .from_date_iso
            .split('T')
            .next()
            .unwrap_or(&query.from_date_iso);
        let to = query
            .to_date_iso
            .split('T')
            .next()
            .unwrap_or(&query.to_date_iso);
        if from > to {
            return Err(conflict(
                "INVALID_DATE_RANGE",
                "From date must be on or before to date.",
            ));
        }
        Ok(())
    }
}

fn db_error(code: &str, message: &str) -> CommandErrorDto {
    CommandErrorDto {
        code: code.to_string(),
        message: message.to_string(),
        kind: "infrastructure".to_string(),
    }
}

fn conflict(code: &str, message: impl Into<String>) -> CommandErrorDto {
    CommandErrorDto {
        code: code.to_string(),
        message: message.into(),
        kind: "conflict".to_string(),
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::db::connection::DbConnection;
    use crate::db::migrate::run_migrations;

    fn test_db() -> DbConnection {
        let conn = DbConnection::open(std::path::Path::new(":memory:")).unwrap();
        run_migrations(&conn).unwrap();
        conn
    }

    fn seed_posted_sale(conn: &DbConnection) {
        let now = "2026-06-20T10:00:00.000Z";
        conn.conn()
            .execute(
                "INSERT INTO fuel_price_records
                 (id, product_id, price_per_litre_minor, effective_from, status, recorded_by, created_at, updated_at)
                 VALUES ('p-seed', 'fuel-product-diesel', 28000, ?1, 'active', 'owner', ?1, ?1)",
                [now],
            )
            .unwrap();
        conn.conn()
            .execute(
                "INSERT INTO fuel_sales
                 (id, sale_date, product_id, quantity_milli_litres, unit_price_minor_per_litre,
                  fuel_price_record_id, total_revenue_minor, total_cogs_minor, payment_method,
                  status, recorded_by, created_at, updated_at, version)
                 VALUES ('fs-r1', ?1, 'fuel-product-diesel', 10000000, 28000, 'p-seed',
                         28000000, 20000000, 'cash', 'posted', 'owner', ?1, ?1, 1)",
                [now],
            )
            .unwrap();
    }

    #[test]
    fn profit_loss_includes_posted_sales() {
        let db = test_db();
        seed_posted_sale(&db);
        let repo = ReportsRepository::new(&db);

        let report = repo
            .profit_loss(&ReportDateRangeQueryDto {
                from_date_iso: "2026-06-01".to_string(),
                to_date_iso: "2026-06-30".to_string(),
            })
            .unwrap();

        assert_eq!(report.fuel_sales_revenue_minor, 28_000_000);
        assert_eq!(report.fuel_cogs_minor, 20_000_000);
        assert_eq!(report.gross_profit_minor, 8_000_000);
        assert_eq!(report.posted_sale_count, 1);
    }

    #[test]
    fn fuel_sales_summary_groups_by_product() {
        let db = test_db();
        seed_posted_sale(&db);
        let repo = ReportsRepository::new(&db);

        let report = repo
            .fuel_sales_summary(&ReportDateRangeQueryDto {
                from_date_iso: "2026-06-01".to_string(),
                to_date_iso: "2026-06-30".to_string(),
            })
            .unwrap();

        assert_eq!(report.lines.len(), 1);
        assert_eq!(report.lines[0].product_code, "diesel");
        assert_eq!(report.total_revenue_minor, 28_000_000);
    }

    #[test]
    fn cash_position_lists_active_accounts() {
        let db = test_db();
        let repo = ReportsRepository::new(&db);
        let report = repo.cash_position().unwrap();
        assert!(report.lines.len() >= 3);
        assert_eq!(report.total_balance_minor, 0);
    }
}
