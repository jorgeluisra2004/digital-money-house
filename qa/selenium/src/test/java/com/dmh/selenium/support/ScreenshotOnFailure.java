package com.dmh.selenium.support;

import java.io.File;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.function.Supplier;

import org.junit.jupiter.api.extension.ExtensionContext;
import org.junit.jupiter.api.extension.TestWatcher;
import org.openqa.selenium.OutputType;
import org.openqa.selenium.TakesScreenshot;
import org.openqa.selenium.WebDriver;

public class ScreenshotOnFailure implements TestWatcher {

    private final Supplier<WebDriver> driverSupplier;

    public ScreenshotOnFailure(Supplier<WebDriver> driverSupplier) {
        this.driverSupplier = driverSupplier;
    }

    @Override
    public void testFailed(ExtensionContext context, Throwable cause) {
        try {
            WebDriver driver = driverSupplier.get();
            if (driver == null) {
                return;
            }

            String name = context.getRequiredTestClass().getSimpleName()
                    + "-" + context.getRequiredTestMethod().getName()
                    + "-" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd-HHmmss"));

            Path dir = Path.of("target", "surefire-reports", "screenshots");
            Files.createDirectories(dir);

            // Screenshot
            File png = ((TakesScreenshot) driver).getScreenshotAs(OutputType.FILE);
            Files.copy(png.toPath(), dir.resolve(name + ".png"));

            // HTML
            Files.writeString(dir.resolve(name + ".html"), driver.getPageSource());
        } catch (Exception ignore) {
        }
    }
}
