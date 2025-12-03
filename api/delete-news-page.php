<?php
/**
 * お知らせ詳細ページ削除API
 * POST /api/delete-news-page.php
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

    // スラッグの形式チェック（セキュリティ対策）
    if (!preg_match('/^[a-z0-9\-]+$/', $slug)) {
        throw new Exception('Invalid slug format');
    }

    // 詳細ページのパス
    $newsDir = dirname(__DIR__) . '/news';
    $detailPagePath = $newsDir . '/' . $slug . '.html';

    // ファイルが存在する場合のみ削除
    if (file_exists($detailPagePath)) {
        if (!unlink($detailPagePath)) {
            throw new Exception('Failed to delete detail page');
        }

        echo json_encode([
            'success' => true,
            'message' => 'Detail page deleted successfully',
            'path' => '/news/' . $slug . '.html'
        ]);
    } else {
        // ファイルが存在しない場合も成功として扱う
        echo json_encode([
            'success' => true,
            'message' => 'Detail page does not exist',
            'path' => '/news/' . $slug . '.html'
        ]);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
