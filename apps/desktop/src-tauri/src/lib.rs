mod db;
mod dto;
mod repositories;
mod commands;
mod services;

use commands::*;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }

      db::init_database(app.handle())?;

      Ok(())
    })
    .invoke_handler(tauri::generate_handler![
      fuel_price_list_products,
      fuel_price_get_product_by_code,
      fuel_price_get_product_by_id,
      fuel_price_get_record_by_id,
      fuel_price_get_active_by_product,
      fuel_price_list_active,
      fuel_price_list_scheduled_by_product,
      fuel_price_list_due_scheduled,
      fuel_price_list_history,
      fuel_price_save_new,
      fuel_price_update_record,
      fuel_price_save_batch,
      fuel_price_log_blocked_edit,
      organization_list,
      organization_get_by_id,
      organization_create,
      organization_update,
      organization_activate,
      organization_archive,
      workspace_get_snapshot,
      workspace_initialize,
      workspace_resolve_active,
      business_partner_list,
      business_partner_get_by_id,
      business_partner_create,
      business_partner_update,
      business_partner_activate,
      business_partner_deactivate,
      business_partner_assign_role,
      business_partner_remove_role,
      fuel_purchase_list,
      fuel_purchase_get_by_id,
      fuel_purchase_record,
      fuel_purchase_post,
      fuel_purchase_void,
      fuel_sale_list,
      fuel_sale_get_by_id,
      fuel_sale_available_stock,
      fuel_sale_record,
      fuel_sale_post,
      fuel_sale_void,
      inventory_product_summary,
      inventory_list_batches,
      inventory_list_movements,
      tank_list,
      tank_get_by_id,
      tank_create,
      tank_update,
      tank_activate,
      tank_deactivate,
      tank_record_dip,
      tank_list_dips,
      cash_account_list,
      cash_account_get_by_id,
      cash_account_create,
      cash_account_update,
      cash_account_activate,
      cash_account_deactivate,
      cash_transfer_list,
      cash_transfer_record,
      operating_expense_list,
      operating_expense_get_by_id,
      operating_expense_record,
      operating_expense_void,
      operating_income_list,
      operating_income_get_by_id,
      operating_income_record,
      operating_income_void,
      accounting_ledger_account_list,
      accounting_ledger_account_get_by_id,
      accounting_journal_list,
      accounting_journal_get_by_id,
      accounting_period_list,
      accounting_period_get_current,
      accounting_period_close,
      accounting_period_reopen,
      person_ledger_list_balances,
      person_ledger_list_entries,
      person_ledger_record_borrow,
      person_ledger_record_repay_borrowed,
      person_ledger_record_lend,
      person_ledger_record_collect_loan,
      report_profit_loss,
      report_fuel_sales_summary,
      report_fuel_product_ledger,
      report_cash_position,
      report_person_ledger_summary,
      report_trial_balance,
      backup_create,
      backup_list,
      backup_verify,
      backup_restore,
      backup_list_audit_events,
      backup_get_storage_path,
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
