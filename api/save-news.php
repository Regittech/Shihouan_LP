<?php
/**
 * お知らせ保存API
 * POST /api/save-news.php
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// OPTIONSリクエストへの対応（CORS preflight）
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// POSTリクエストのみ許可
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method Not Allowed']);
    exit;
}

// JSONデータファイルのパス
$dataFilePath = dirname(__DIR__) . '/news-data.json';

try {
    // POSTデータを取得
    $input = file_get_contents('php://input');
    $requestData = json_decode($input, true);

    if (!$requestData) {
        throw new Exception('Invalid JSON data');
    }

    // 既存データを読み込む
    if (!file_exists($dataFilePath)) {
        // ファイルが存在しない場合は初期データを作成
        $data = [
            'news' => [],
            'settings' => [
                'adminPasswordHash' => '020dda5b9cec56b395090b523f4f7aa1c0702daee75090a6daa98c13072242d7',
                'nextId' => 1
            ]
        ];
    } else {
        $jsonContent = file_get_contents($dataFilePath);
        $data = json_decode($jsonContent, true);

        if (!$data) {
            throw new Exception('Failed to parse existing data');
        }
    }

    // リクエストされたデータで更新
    if (isset($requestData['news'])) {
        $data['news'] = $requestData['news'];
    }

    if (isset($requestData['settings'])) {
        $data['settings'] = $requestData['settings'];
    }

    // JSONファイルに保存
    $jsonData = json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);

    if (file_put_contents($dataFilePath, $jsonData) === false) {
        throw new Exception('Failed to save data');
    }

    // 成功レスポンス
    echo json_encode([
        'success' => true,
        'message' => 'Data saved successfully'
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
