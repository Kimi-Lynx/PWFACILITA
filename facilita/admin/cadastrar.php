<?php
require_once "config.php";
$signup_message = "";

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $name = $_POST["name"];
    $email = $_POST["email"];
    $password = $_POST["password"];
    $hashed_password = password_hash($password, PASSWORD_DEFAULT);

    $sql = "INSERT INTO users (name, email, password) VALUES (?, ?, ?)";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("sss", $name, $email, $hashed_password);

    if ($stmt->execute()) {
        $feedback_message = "Usuário criado com sucesso!";
    } else {
        $feedback_message = "Erro: " . $sql . "<br>"  . $conn->error;
    }

    $stmt->close();
}

$conn->close();
?>

<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Tela de Cadastro</title>
<style>

  body {
    margin: 0;
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    background: linear-gradient(to right, #04232F, #FFFFFF);
    font-family: Arial, sans-serif;
  }

  .login-container {
    display: flex;
    background-color: #FFFFFF;
    border-radius: 10px;
    box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.2);
    overflow: hidden;
  }

  .left-side {
    flex: 1;
    background-color: #04232F;
    color: white;
    padding: 30px;
  }

  .right-side {
    flex: 1;
    padding: 30px;
  }

  .login-form {
    max-width: 300px;
    margin: 0 auto;
  }

  .login-form input {
    width: 100%;
    padding: 10px;
    margin-bottom: 15px;
    border: 1px solid #ccc;
    border-radius: 5px;
  }

  .login-form button {
    width: 100%;
    padding: 10px;
    background-color: #04232F;
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
  }
  

</style>

<link rel = "stylesheet" href="estilo.css">

</head>
<body>
    <div class="login-container">
        <div class="left-side">
            <h1>Bem-vindo!</h1>
            <p>Cadastre-se</p>
        </div>
        <div class="right-side">
            <div class="login-form">
                <h2>Cadastre-se</h2>
                <?php if (isset($feedback_message)) : ?>
                    <p><?php echo $feedback_message; ?></p>
                <?php endif; ?>

                <form method="post" action="cadastrar.php">
                    <input type="text" name="name" placeholder="Nome" required>
                    <input type="text" name="email" placeholder="Email" required>
                    <input type="password" name="password" placeholder="Senha" required>
                    <button type="submit">Entrar</button>
                </form>

                <p>Já possui uma conta? <a href="./indexlogin.php">Faça login</a></p>
            </div>
        </div>
    </div>
  </div>
</body>
</html>