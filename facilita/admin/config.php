<?php

    $servername = "localhost";
    $username = "kimi";
    $password = "123";
    $dbname = "login";

    $conn = new mysqli($servername, $username, $password, $dbname);


    if($conn->connect_error){
        die("Falha na conexão" . $conn->connect_error);
    }

?>