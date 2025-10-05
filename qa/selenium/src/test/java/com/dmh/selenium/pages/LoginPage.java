package com.dmh.selenium.pages;

import com.dmh.selenium.BaseTest;
import org.openqa.selenium.By;

public class LoginPage extends BaseTest {
  private final By email = By.cssSelector("input[type='email'], input[name='email']");
  private final By password = By.cssSelector("input[type='password'], input[name='password']");
  private final By submit = By.cssSelector("button[type='submit']");

  public void login(String user, String pass) {
    go("/login");
    type(email, user);
    type(password, pass);
    click(submit);
    // esperar que aparezca navbar (saludo)
    el(By.cssSelector("[data-testid='navbar-user-greeting']"));
  }
}
