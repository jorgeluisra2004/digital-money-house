package com.dmh.selenium.pages;

import com.dmh.selenium.BaseTest;
import org.openqa.selenium.By;

public class PerfilPage extends BaseTest {
  private final By copyCvu = By.cssSelector("[data-testid='perfil-copy-cvu']");
  private final By copyAlias = By.cssSelector("[data-testid='perfil-copy-alias']");
  private final By editAliasBtn = By.xpath("//button[normalize-space()='Editar']");
  private final By aliasInput = By.cssSelector("[data-testid='perfil-alias-input']");
  private final By saveAlias = By.xpath("//button[normalize-space()='Guardar']");

  public void open() { go("/perfil"); }

  public void copyBoth() {
    click(copyCvu);
    click(copyAlias);
  }

  public void editAlias(String alias) {
    click(editAliasBtn);
    type(aliasInput, alias);
    click(saveAlias);
  }
}
