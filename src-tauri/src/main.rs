// 本地优先桌面壳：直接加载同源前端（dist），所有请求由前端发往用户配置的 API。
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_http::init())
        .run(tauri::generate_context!())
        .expect("error while running 于师傅的导演台");
}
