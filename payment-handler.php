<?php

$logData = [
    'time' => date('Y-m-d H:i:s'),
    'method' => $_SERVER['REQUEST_METHOD'],
    'user_agent' => $_SERVER['HTTP_USER_AGENT']??'无'
];
file_put_contents('payment_log.text', json_encode($logData) . "\n", FILE_APPEND);

//判断是否是支付平台

function isPaymentPlatform() {
    $ua = $_SERVER['HTTP_USER_AGENT']?? '';
    return empty($ua) || $_SERVER['REQUEST_METHOD'] === 'POST';
}

if (isPaymentPlatform()) {
    //支付平台访问 - 返回success
    header('Content-Type: text/plain');
    echo 'success';

}else{
    //用户访问 - 直接跳转到你的HTML页面
    header('Location: /payment-success.html');
}

?>

