pub mod accounting;
pub mod backup;
pub mod business_partner;
pub mod cash;
pub mod fuel_price;
pub mod fuel_purchase;
pub mod fuel_sale;
pub mod inventory;
pub mod operating_expense;
pub mod operating_income;
pub mod organization;
pub mod person_ledger;
pub mod reports;
pub mod tank;

macro_rules! impl_command_error_from_string {
    ($error_type:ty) => {
        impl From<String> for $error_type {
            fn from(message: String) -> Self {
                Self {
                    code: "DB_ACCESS_FAILED".to_string(),
                    message,
                    kind: "infrastructure".to_string(),
                }
            }
        }
    };
}

impl_command_error_from_string!(accounting::CommandErrorDto);
impl_command_error_from_string!(backup::CommandErrorDto);
impl_command_error_from_string!(business_partner::CommandErrorDto);
impl_command_error_from_string!(cash::CommandErrorDto);
impl_command_error_from_string!(fuel_price::CommandErrorDto);
impl_command_error_from_string!(fuel_purchase::CommandErrorDto);
impl_command_error_from_string!(fuel_sale::CommandErrorDto);
impl_command_error_from_string!(inventory::CommandErrorDto);
impl_command_error_from_string!(operating_expense::CommandErrorDto);
impl_command_error_from_string!(operating_income::CommandErrorDto);
impl_command_error_from_string!(person_ledger::CommandErrorDto);
impl_command_error_from_string!(reports::CommandErrorDto);
impl_command_error_from_string!(tank::CommandErrorDto);
