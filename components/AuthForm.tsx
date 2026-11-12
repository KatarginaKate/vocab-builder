"use client";

import { yupResolver } from "@hookform/resolvers/yup";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import * as yup from "yup";
import { authenticate } from "@/services/auth";
import styles from "./AuthForm.module.css";

type FormValues = {
  name?: string;
  email: string;
  password: string;
};

type AuthFormProps = {
  mode: "register" | "login";
};

const passwordPattern = /^(?=.*[A-Za-z]{6})(?=.*\d)[A-Za-z\d]{7}$/;
const emailPattern = /^\w+@[a-zA-Z_]+?\.[a-zA-Z]{2,3}$/;

function makeSchema(mode: AuthFormProps["mode"]): yup.ObjectSchema<FormValues> {
  const nameSchema =
    mode === "register"
      ? yup.string().trim().required("Name is required.")
      : yup.string().trim().optional();

  return yup.object({
    name: nameSchema,
    email: yup
      .string()
      .required("Email is required.")
      .matches(emailPattern, "Enter a valid email address."),
    password: yup
      .string()
      .required("Password is required.")
      .matches(
        passwordPattern,
        "Password must contain 6 English letters and 1 number.",
      ),
  });
}

export default function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const isRegister = mode === "register";
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState("");
  const [notice, setNotice] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: yupResolver(makeSchema(mode)),
    mode: "onSubmit",
  });

  const onSubmit = async (values: FormValues) => {
    setServerError("");
    setNotice("");

    try {
      const result = await authenticate(isRegister ? "signup" : "signin", values);
      window.localStorage.setItem("vocab-builder-token", result.token);
      window.localStorage.setItem(
        "vocab-builder-user",
        JSON.stringify({ name: result.name, email: result.email }),
      );
      setNotice(isRegister ? "Account created. Opening your dictionary…" : "Signed in. Opening your dictionary…");
      router.push("/dictionary");
    } catch (error) {
      setServerError(
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again.",
      );
    }
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit(onSubmit)} noValidate>
      {isRegister && (
        <div className={styles.field}>
          <input
            autoComplete="name"
            aria-label="Name"
            placeholder="Name"
            aria-invalid={Boolean(errors.name)}
            {...register("name")}
          />
          {errors.name && <small>{errors.name.message}</small>}
        </div>
      )}

      <div className={styles.field}>
        <input
          type="email"
          autoComplete="email"
          aria-label="Email"
          placeholder="Email"
          aria-invalid={Boolean(errors.email)}
          {...register("email")}
        />
        {errors.email && <small>{errors.email.message}</small>}
      </div>

      <div className={styles.field}>
        <span className={styles.passwordInput}>
          <input
            type={showPassword ? "text" : "password"}
            autoComplete={isRegister ? "new-password" : "current-password"}
            aria-label="Password"
            placeholder="Password"
            aria-invalid={Boolean(errors.password)}
            {...register("password")}
          />
          <button
            className={styles.eyeButton}
            type="button"
            onClick={() => setShowPassword((visible) => !visible)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            aria-pressed={showPassword}
          >
            <svg viewBox="0 0 32 32" aria-hidden="true">
              <use href={`/sprite.svg#icon-eye-${showPassword ? "open" : "off"}`} />
            </svg>
          </button>
        </span>
        {errors.password && <small>{errors.password.message}</small>}
      </div>

      {serverError && (
        <p className={styles.errorNotice} role="alert">
          {serverError}
        </p>
      )}
      {notice && (
        <p className={styles.successNotice} role="status">
          {notice}
        </p>
      )}

      <button className={styles.submitButton} type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Please wait…" : isRegister ? "Register" : "Login"}
      </button>
    </form>
  );
}
