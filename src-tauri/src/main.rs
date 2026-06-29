// Prevents additional console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde::{Deserialize, Serialize};
use tauri::State;
use tauri_plugin_store::StoreExt;
use tiberius::{Client, Config};
use tokio::net::TcpStream;
use tokio_util::compat::TokioAsyncWriteCompatExt;
use std::sync::Mutex;

// ─── Data structs ─────────────────────────────────────────────────────────────

#[derive(Debug, Serialize, Deserialize, Clone)]
struct ProcessLog {
    id: i32,
    process_name: String,
    machine_name: String,
    status: String,
    created_on: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
struct VoltageRow {
    voltage_v1: f64,
    voltage_v2: f64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
struct AppConfig {
    server: String,
    database: String,
}

impl Default for AppConfig {
    fn default() -> Self {
        AppConfig {
            server: r"NAGARA\SQLEXPRESS2019".to_string(),
            database: "TEST123".to_string(),
        }
    }
}

// ─── Shared state ─────────────────────────────────────────────────────────────

struct AppState {
    config: Mutex<AppConfig>,
}

// ─── SQL helper ───────────────────────────────────────────────────────────────

async fn make_client(
    server: &str,
) -> Result<Client<tokio_util::compat::Compat<TcpStream>>, String> {
    let mut config = Config::new();

    // Parse formats: HOST\INSTANCE,PORT  |  HOST\INSTANCE  |  HOST,PORT  |  HOST
    let (host_instance, explicit_port) = match server.rfind(',') {
        Some(idx) => {
            let port_str = server[idx + 1..].trim();
            match port_str.parse::<u16>() {
                Ok(p) => (&server[..idx], Some(p)),
                Err(_) => (server, None),
            }
        }
        None => (server, None),
    };

    if host_instance.contains('\\') {
        let parts: Vec<&str> = host_instance.splitn(2, '\\').collect();
        config.host(parts[0]);
        config.instance_name(parts[1]);
    } else {
        config.host(host_instance);
    }

    if let Some(port) = explicit_port {
        config.port(port);
    }

    // Windows Integrated Security via SSPI (Windows-only at runtime)
    #[cfg(target_os = "windows")]
    config.authentication(tiberius::AuthMethod::Integrated);

    // On non-Windows systems this path is unused; the binary only ships on Windows
    #[cfg(not(target_os = "windows"))]
    config.authentication(tiberius::AuthMethod::None);

    config.trust_cert();

    let tcp = TcpStream::connect(config.get_addr())
        .await
        .map_err(|e| format!("TCP connect failed: {e}"))?;

    tcp.set_nodelay(true)
        .map_err(|e| format!("set_nodelay failed: {e}"))?;

    Client::connect(config, tcp.compat_write())
        .await
        .map_err(|e| format!("SQL connect failed: {e}"))
}

// ─── Commands ─────────────────────────────────────────────────────────────────

#[tauri::command]
async fn test_connection(state: State<'_, AppState>) -> Result<bool, String> {
    let server = {
        let cfg = state.config.lock().map_err(|e| e.to_string())?;
        cfg.server.clone()
    };
    match make_client(&server).await {
        Ok(_) => Ok(true),
        Err(_) => Ok(false),
    }
}

#[tauri::command]
async fn get_projects(state: State<'_, AppState>) -> Result<Vec<String>, String> {
    let server = {
        let cfg = state.config.lock().map_err(|e| e.to_string())?;
        cfg.server.clone()
    };

    let mut client = make_client(&server).await?;

    let rows = client
        .query(
            "SELECT name FROM sys.databases \
             WHERE state_desc = 'ONLINE' \
             AND name NOT IN ('master','tempdb','model','msdb') \
             ORDER BY name",
            &[],
        )
        .await
        .map_err(|e| format!("Query failed: {e}"))?
        .into_first_result()
        .await
        .map_err(|e| format!("Fetch failed: {e}"))?;

    let names: Vec<String> = rows
        .iter()
        .filter_map(|row| row.get::<&str, usize>(0).map(|s| s.to_owned()))
        .collect();

    Ok(names)
}

#[tauri::command]
async fn get_process_logs(
    db_name: String,
    state: State<'_, AppState>,
) -> Result<Vec<ProcessLog>, String> {
    let server = {
        let cfg = state.config.lock().map_err(|e| e.to_string())?;
        cfg.server.clone()
    };

    let mut client = make_client(&server).await?;

    let query = format!(
        "SELECT TOP 200 id, process_name, machine_name, status, \
         CONVERT(varchar, created_on, 120) as created_on \
         FROM [{db_name}].[dbo].[process_data] \
         ORDER BY created_on DESC"
    );

    let query_result = client.query(query.as_str(), &[]).await;
    let rows = match query_result {
        Ok(r) => match r.into_first_result().await {
            Ok(rows) => rows,
            Err(_) => return Ok(vec![]), // table doesn't exist or no data
        },
        Err(_) => return Ok(vec![]), // table doesn't exist in this DB
    };

    let logs: Vec<ProcessLog> = rows
        .iter()
        .map(|row| ProcessLog {
            id: row.get::<i32, usize>(0).unwrap_or(0),
            process_name: row.get::<&str, usize>(1).unwrap_or("").to_owned(),
            machine_name: row.get::<&str, usize>(2).unwrap_or("").to_owned(),
            status: row.get::<&str, usize>(3).unwrap_or("").to_owned(),
            created_on: row.get::<&str, usize>(4).unwrap_or("").to_owned(),
        })
        .collect();

    Ok(logs)
}

#[tauri::command]
async fn get_voltage_data(
    db_name: String,
    state: State<'_, AppState>,
) -> Result<Vec<VoltageRow>, String> {
    let server = {
        let cfg = state.config.lock().map_err(|e| e.to_string())?;
        cfg.server.clone()
    };

    let mut client = make_client(&server).await?;

    let query = format!(
        "SELECT TOP 200 VOLTAGE_V1, VOLTAGE_V2 FROM [{db_name}].[dbo].[EM_1]"
    );

    let rows = client
        .query(query.as_str(), &[])
        .await
        .map_err(|e| format!("Query failed: {e}"))?
        .into_first_result()
        .await
        .map_err(|e| format!("Fetch failed: {e}"))?;

    let data: Vec<VoltageRow> = rows
        .iter()
        .map(|row| VoltageRow {
            voltage_v1: row.get::<f64, usize>(0).unwrap_or(0.0),
            voltage_v2: row.get::<f64, usize>(1).unwrap_or(0.0),
        })
        .collect();

    Ok(data)
}

#[tauri::command]
async fn save_config(
    server: String,
    database: String,
    state: State<'_, AppState>,
    app: tauri::AppHandle,
) -> Result<(), String> {
    {
        let mut cfg = state.config.lock().map_err(|e| e.to_string())?;
        cfg.server = server.clone();
        cfg.database = database.clone();
    }

    let store = app
        .store("config.json")
        .map_err(|e| format!("Store error: {e}"))?;

    store.set("server", serde_json::Value::String(server));
    store.set("database", serde_json::Value::String(database));
    store.save().map_err(|e| format!("Save error: {e}"))?;

    Ok(())
}

#[tauri::command]
async fn load_config(
    state: State<'_, AppState>,
    app: tauri::AppHandle,
) -> Result<AppConfig, String> {
    let store = app
        .store("config.json")
        .map_err(|e| format!("Store error: {e}"))?;

    let server = store
        .get("server")
        .and_then(|v| v.as_str().map(|s| s.to_owned()))
        .unwrap_or_else(|| r"NAGARA\SQLEXPRESS2019".to_string());

    let database = store
        .get("database")
        .and_then(|v| v.as_str().map(|s| s.to_owned()))
        .unwrap_or_else(|| "TEST123".to_string());

    let cfg = AppConfig {
        server: server.clone(),
        database: database.clone(),
    };

    {
        let mut state_cfg = state.config.lock().map_err(|e| e.to_string())?;
        *state_cfg = cfg.clone();
    }

    Ok(cfg)
}

// ─── Entry point ──────────────────────────────────────────────────────────────

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_store::Builder::default().build())
        .manage(AppState {
            config: Mutex::new(AppConfig::default()),
        })
        .invoke_handler(tauri::generate_handler![
            test_connection,
            get_projects,
            get_process_logs,
            get_voltage_data,
            save_config,
            load_config,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
