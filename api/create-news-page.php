<?php
/**
 * お知らせ詳細ページ作成API
 * POST /api/create-news-page.php
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

try {
    // POSTデータを取得
    $input = file_get_contents('php://input');
    $requestData = json_decode($input, true);

    if (!$requestData || !isset($requestData['slug'])) {
        throw new Exception('Slug is required');
    }

    $slug = $requestData['slug'];

    // テンプレートファイルのパス
    $templatePath = dirname(__DIR__) . '/news-detail-template.html';

    if (!file_exists($templatePath)) {
        throw new Exception('Template file not found');
    }

    // newsディレクトリが存在しない場合は作成
    $newsDir = dirname(__DIR__) . '/news';
    if (!is_dir($newsDir)) {
        if (!mkdir($newsDir, 0755, true)) {
            throw new Exception('Failed to create news directory');
        }
    }

    // 詳細ページのパス
    $detailPagePath = $newsDir . '/' . $slug . '.html';

    // テンプレートファイルをコピー
    if (!copy($templatePath, $detailPagePath)) {
        throw new Exception('Failed to create detail page');
    }

    // 成功レスポンス
    echo json_encode([
        'success' => true,
        'message' => 'Detail page created successfully',
        'path' => '/news/' . $slug . '.html'
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
