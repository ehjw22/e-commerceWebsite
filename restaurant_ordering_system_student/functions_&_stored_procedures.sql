--
-- PostgreSQL database dump
--

\restrict 5fKPD8jDxIhe6PS6a43NgUJ5lvdXZsc3OBd2DuhAMXIkJ3xG6CwBy4r2vSx9XHY

-- Dumped from database version 18.3
-- Dumped by pg_dump version 18.3

-- Started on 2026-06-29 15:56:14

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 245 (class 1255 OID 41824)
-- Name: create_feedback(text, integer, integer, integer); Type: PROCEDURE; Schema: public; Owner: -
--

CREATE PROCEDURE public.create_feedback(IN u_feedback text, IN u_ratings integer, IN u_member_id integer, IN u_product_id integer)
    LANGUAGE plpgsql
    AS $$	
DECLARE
	u_order_id INT;
BEGIN
	SELECT so.member_id
	INTO u_order_id
	FROM sale_order_item soi
	JOIN sale_order so on soi.order_id = so.order_id
	WHERE so.member_id = u_member_id AND soi.product_id = u_product_id and so.status = 'COMPLETED'
	LIMIT 1;

	-- Validation: Verify product purchase history
	IF u_order_id is NULL THEN
		RAISE EXCEPTION 'You have not bought this product before';
	END IF;

	-- Insert the specified feedback record
	INSERT INTO dining_feedback (product_id, member_id, comments, ratings, last_updated)
	VALUES (u_product_id, u_member_id, u_feedback, u_ratings, NOW());
	
EXCEPTION
	WHEN raise_exception THEN
		RAISE NOTICE 'Validation failed: %', SQLERRM;
		RAISE; 

	WHEN OTHERS THEN
		RAISE NOTICE 'An unexpected database error occurred: %', SQLERRM;
		RAISE EXCEPTION 'Database execution failed. Please check your inputs.';
END;
$$;


--
-- TOC entry 246 (class 1255 OID 41910)
-- Name: create_response(text, integer, integer); Type: PROCEDURE; Schema: public; Owner: -
--

CREATE PROCEDURE public.create_response(IN u_response text, IN u_member_id integer, IN u_dining_feedback_id integer)
    LANGUAGE plpgsql
    AS $$	
DECLARE
    v_original_member_id INT;
BEGIN
    SELECT member_id INTO v_original_member_id
    FROM dining_feedback 
    WHERE feedback_id = u_dining_feedback_id;

	-- Validation: Existence check
    IF NOT FOUND THEN
        RAISE EXCEPTION 'The specified dining feedback does not exist for this product.';
    END IF;

    -- Authorization check: Ensure users do not respond to their own records
    IF v_original_member_id = u_member_id THEN
        RAISE EXCEPTION 'Members are not permitted to respond to their own dining feedback.';
    END IF;

    -- Insert the specified response record
    INSERT INTO feedback (dining_feedback_id, member_id, comments)
    VALUES (u_dining_feedback_id, u_member_id, u_response);

EXCEPTION
    WHEN raise_exception THEN
        RAISE NOTICE 'Validation failed: %', SQLERRM;
        RAISE; 

    WHEN OTHERS THEN
        RAISE NOTICE 'An unexpected database error occurred: %', SQLERRM;
        RAISE EXCEPTION 'Database execution failed. Please check your inputs.';
END;
$$;


--
-- TOC entry 247 (class 1255 OID 41885)
-- Name: create_response(text, integer, integer, integer); Type: PROCEDURE; Schema: public; Owner: -
--

CREATE PROCEDURE public.create_response(IN u_response text, IN u_member_id integer, IN u_dining_feedback_id integer, IN u_product_id integer)
    LANGUAGE plpgsql
    AS $$	
DECLARE
    v_original_member_id INT;
BEGIN
    PERFORM 1 
    FROM product 
    WHERE product_id = u_product_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'This product does not exist.';
    END IF;

    SELECT member_id INTO v_original_member_id
    FROM dining_feedback 
    WHERE feedback_id = u_dining_feedback_id AND product_id = u_product_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'The specified dining feedback does not exist for this product.';
    END IF;

    IF v_original_member_id = u_member_id THEN
        RAISE EXCEPTION 'Members are not permitted to respond to their own dining feedback.';
    END IF;

    INSERT INTO feedback (dining_feedback_id, member_id, comments)
    VALUES (u_dining_feedback_id, u_member_id, u_response);

EXCEPTION
    WHEN raise_exception THEN
        RAISE NOTICE 'Validation failed: %', SQLERRM;
        RAISE; 

    WHEN OTHERS THEN
        RAISE NOTICE 'An unexpected database error occurred: %', SQLERRM;
        RAISE EXCEPTION 'Database execution failed. Please check your inputs.';
END;
$$;


--
-- TOC entry 244 (class 1255 OID 41828)
-- Name: delete_feedback(integer, integer); Type: PROCEDURE; Schema: public; Owner: -
--

CREATE PROCEDURE public.delete_feedback(IN u_feedback_id integer, IN u_member_id integer)
    LANGUAGE plpgsql
    AS $$	
DECLARE
	v_member_id INT;
BEGIN
	SELECT member_id
	INTO v_member_id
	FROM dining_feedback
	WHERE feedback_id = u_feedback_id;

	-- Validation: Existence check
	IF NOT FOUND THEN
		RAISE EXCEPTION 'Feedback does not exist. Try again.';
	END IF;

	-- Authorization check: Ensure users can only remove their own records
	IF v_member_id != u_member_id THEN
		RAISE EXCEPTION 'You can only delete your own feedback';
	END IF;
	
	-- Delete the specified feedback record
	DELETE FROM dining_feedback
	WHERE feedback_id = u_feedback_id;
	
EXCEPTION
	WHEN raise_exception THEN
		RAISE NOTICE 'Validation failed: %', SQLERRM;
		RAISE; 

	WHEN OTHERS THEN
		RAISE NOTICE 'An unexpected database error occurred: %', SQLERRM;
		RAISE EXCEPTION 'Database execution failed during deletion.';
END;
$$;


--
-- TOC entry 251 (class 1255 OID 41909)
-- Name: delete_response(integer, integer); Type: PROCEDURE; Schema: public; Owner: -
--

CREATE PROCEDURE public.delete_response(IN u_response_id integer, IN u_member_id integer)
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_actual_owner_id INT;
BEGIN
   	-- Validation: Existence check
	IF NOT EXISTS (
		SELECT 1 
		FROM member 
		WHERE member_id = u_member_id
	) THEN
		RAISE EXCEPTION 'This member does not exist.';
	END IF;

    SELECT member_id INTO v_actual_owner_id
    FROM feedback
    WHERE feedback_id = u_response_id;

	-- Validation: Existence check
    IF NOT FOUND THEN
        RAISE EXCEPTION 'The requested response does not exist.';
    END IF;

    -- Authorization check: Ensure users can only remove their own records
    IF v_actual_owner_id <> u_member_id THEN
        RAISE EXCEPTION 'You are not authorized to delete this response.';
    END IF;

    -- Delete the specified response record
    DELETE FROM feedback 
    WHERE feedback_id = u_response_id;

EXCEPTION
    WHEN raise_exception THEN
        RAISE NOTICE 'Validation failed: %', SQLERRM;
        RAISE; 

    WHEN OTHERS THEN
        RAISE NOTICE 'An unexpected database error occurred: %', SQLERRM;
        RAISE EXCEPTION 'Database execution failed during deletion.';
END;
$$;


--
-- TOC entry 232 (class 1255 OID 41829)
-- Name: edit_feedback(integer, integer, text, integer); Type: PROCEDURE; Schema: public; Owner: -
--

CREATE PROCEDURE public.edit_feedback(IN u_feedback_id integer, IN u_member_id integer, IN new_comment text, IN new_rating integer)
    LANGUAGE plpgsql
    AS $$	
DECLARE
	v_member_id INT;
BEGIN
	SELECT member_id
	INTO v_member_id
	FROM dining_feedback
	WHERE feedback_id = u_feedback_id;

	IF NOT FOUND THEN
		RAISE EXCEPTION 'Feedback does not exist. Try again.';
	END IF;

	IF v_member_id != u_member_id THEN
		RAISE EXCEPTION 'You can only delete your own feedback';
	END IF;
	
	UPDATE dining_feedback 
	SET comments = new_comment, ratings = new_rating
	WHERE feedback_id = u_feedback_id;
END;
$$;


--
-- TOC entry 250 (class 1255 OID 41831)
-- Name: get_feedback(integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_feedback(u_member_id integer) RETURNS TABLE(comments text, ratings integer, product_name character varying, feedback_id integer, last_updated timestamp without time zone)
    LANGUAGE plpgsql
    AS $$	
BEGIN
	-- Validation: Existence check
	IF NOT EXISTS (
		SELECT 1 
		FROM member 
		WHERE member_id = u_member_id
	) THEN
		RAISE EXCEPTION 'This member does not exist.' USING ERRCODE = 'P0003';
	END IF;

	-- Validation: Verification check
    IF NOT EXISTS (
        SELECT 1 
        FROM dining_feedback 
        WHERE member_id = u_member_id
    ) THEN
        RAISE EXCEPTION 'You have not made any feedback.' USING ERRCODE = 'P0002';
    END IF;
	
	-- Return the table of matching feedback records
    RETURN QUERY
    SELECT 
        df.comments,
        df.ratings,
        p.name AS product_name,
        df.feedback_id,
        df.last_updated
    FROM dining_feedback df
    JOIN product p ON p.product_id = df.product_id
    WHERE df.member_id = u_member_id
    ORDER BY df.product_id ASC, df.last_updated DESC;
	
EXCEPTION
	WHEN raise_exception THEN
		RAISE NOTICE 'Validation failed: %', SQLERRM;
		RAISE; 

	WHEN OTHERS THEN
		RAISE NOTICE 'An unexpected database error occurred: %', SQLERRM;
		RAISE EXCEPTION 'Database execution failed during data retrieval.';
END;
$$;


--
-- TOC entry 252 (class 1255 OID 41950)
-- Name: get_response(integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_response(u_member_id integer) RETURNS TABLE(feedback_id integer, response text, feedback text, product_name character varying)
    LANGUAGE plpgsql
    AS $$	
BEGIN
	-- Validation: Existence check
	IF NOT EXISTS (
		SELECT 1 
		FROM member 
		WHERE member_id = u_member_id
	) THEN
		RAISE EXCEPTION 'This member does not exist.' USING ERRCODE = 'P0003';
	END IF;

	-- Validation: Verification check
    IF NOT EXISTS (
        SELECT 1 
        FROM feedback
        WHERE member_id = u_member_id
    ) THEN
        RAISE EXCEPTION 'You have not made any responses.' USING ERRCODE = 'P0002';
    END IF;
	
	-- Return the table of matching response records
    RETURN QUERY
    SELECT
		f.feedback_id,
		f.comments as response,
		df.comments as feedback,
		p.name as product_name
	FROM feedback f
	JOIN dining_feedback df on f.dining_feedback_id = df.feedback_id
	JOIN product p on p.product_id = df.product_id
	WHERE f.member_id = u_member_id;	
	

END;
$$;


--
-- TOC entry 249 (class 1255 OID 41914)
-- Name: get_sale_order_summary(date, date, character varying, character varying, character varying); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_sale_order_summary(start_date date DEFAULT NULL::date, end_date date DEFAULT NULL::date, category character varying DEFAULT NULL::character varying, sort_by character varying DEFAULT 'order_date'::character varying, sort_order character varying DEFAULT 'DESC'::character varying) RETURNS TABLE(order_id integer, customer_name character varying, order_date timestamp without time zone, total_amount numeric, status character varying, product_count bigint, products_ordered text)
    LANGUAGE plpgsql
    AS $_$
DECLARE
    query_str TEXT;
BEGIN
    -- Base query string: Modified STRING_AGG to prepend hyphens and split items onto newlines
    query_str := '
        SELECT 
            so.order_id,
            m.username AS customer_name,
            so.order_date,
            so.total_amount,
            so.status,
            COALESCE(SUM(soi.quantity), 0)::BIGINT AS product_count,
			COALESCE(STRING_AGG(''- '' || p.name || '' (x'' || soi.quantity || '')'', ''<br>''), ''None'') AS products_ordered        
		FROM member m
        JOIN sale_order so ON m.member_id = so.member_id
        JOIN sale_order_item soi ON soi.order_id = so.order_id
        JOIN product p ON soi.product_id = p.product_id
        WHERE 1=1
    ';

    -- Build Filters: Conditionally append criteria based on provided parameters using strict parameter binders
    IF start_date IS NOT NULL THEN
        query_str := query_str || ' AND so.order_date >= $1';
    END IF;

    IF end_date IS NOT NULL THEN
        query_str := query_str || ' AND so.order_date <= $2';
    END IF;

    IF category IS NOT NULL AND category <> '' THEN
        query_str := query_str || ' AND p.category = $3';
    END IF;

    -- Standard dynamic grouping extension
    query_str := query_str || ' GROUP BY so.order_id, m.username, so.order_date, so.total_amount, so.status';

    -- Sanitize dynamic sort order input values
    IF UPPER(sort_order) NOT IN ('ASC', 'DESC') THEN
        sort_order := 'DESC';
    END IF;

    -- Map client-side field parameters safely to relational identifiers
    IF sort_by = 'customer_name' THEN sort_by := 'm.username';
    ELSIF sort_by = 'total_amount' THEN sort_by := 'so.total_amount';
    ELSIF sort_by = 'status' THEN sort_by := 'so.status';
    ELSE sort_by := 'so.order_date';
    END IF;

    query_str := query_str || ' ORDER BY ' || sort_by || ' ' || sort_order;

    -- Execute the dynamically built query string while passing values safely via USING ($1, $2, $3 syntax)
    RETURN QUERY EXECUTE query_str USING start_date, end_date, category;

    -- Validation: Raise an exception if no matching orders are found in the query execution block
    IF NOT FOUND THEN
        RAISE EXCEPTION 'No sales orders found matching the specified criteria.' USING ERRCODE = 'P0002';
    END IF;

EXCEPTION
    -- Validation block mapping
    WHEN raise_exception THEN
        RAISE NOTICE 'Validation failed: %', SQLERRM;
        RAISE;

    WHEN OTHERS THEN
        RAISE NOTICE 'An unexpected report rendering error occurred: %', SQLERRM;
        RAISE EXCEPTION 'Database execution failed to aggregate sale logs.';
END;
$_$;


--
-- TOC entry 248 (class 1255 OID 41830)
-- Name: update_feedback(integer, integer, text, integer); Type: PROCEDURE; Schema: public; Owner: -
--

CREATE PROCEDURE public.update_feedback(IN u_feedback_id integer, IN u_member_id integer, IN new_comment text, IN new_rating integer)
    LANGUAGE plpgsql
    AS $$	
DECLARE
	v_member_id INT;
BEGIN
	SELECT member_id
	INTO v_member_id
	FROM dining_feedback
	WHERE feedback_id = u_feedback_id;

	-- Validation: Existence check
	IF NOT FOUND THEN
		RAISE EXCEPTION 'Feedback does not exist. Try again.';
	END IF;

	-- Authorization check: Ensure users can only edit their own records
	IF v_member_id != u_member_id THEN
		RAISE EXCEPTION 'You can only update your own feedback';
	END IF;
	
	-- Update the specified feedback record
	UPDATE dining_feedback 
	SET comments = new_comment, ratings = new_rating
	WHERE feedback_id = u_feedback_id;
	
EXCEPTION
	WHEN raise_exception THEN
		RAISE NOTICE 'Validation failed: %', SQLERRM;
		RAISE; 

	WHEN OTHERS THEN
		RAISE NOTICE 'An unexpected database error occurred: %', SQLERRM;
		RAISE EXCEPTION 'Database execution failed during update.';
END;
$$;


--
-- TOC entry 229 (class 1259 OID 25237)
-- Name: dining_feedback; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.dining_feedback (
    feedback_id integer NOT NULL,
    product_id integer NOT NULL,
    member_id integer NOT NULL,
    comments text NOT NULL,
    ratings integer NOT NULL,
    last_updated timestamp without time zone,
    CONSTRAINT score_range CHECK (((ratings >= 1) AND (ratings <= 5)))
);


--
-- TOC entry 228 (class 1259 OID 25236)
-- Name: dining_feedback_feedback_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.dining_feedback_feedback_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5087 (class 0 OID 0)
-- Dependencies: 228
-- Name: dining_feedback_feedback_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.dining_feedback_feedback_id_seq OWNED BY public.dining_feedback.feedback_id;


--
-- TOC entry 231 (class 1259 OID 41887)
-- Name: feedback; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.feedback (
    dining_feedback_id integer NOT NULL,
    member_id integer NOT NULL,
    feedback_id integer NOT NULL,
    comments text NOT NULL
);


--
-- TOC entry 230 (class 1259 OID 41886)
-- Name: feedback_feedback_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.feedback_feedback_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5088 (class 0 OID 0)
-- Dependencies: 230
-- Name: feedback_feedback_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.feedback_feedback_id_seq OWNED BY public.feedback.feedback_id;


--
-- TOC entry 219 (class 1259 OID 25134)
-- Name: member; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.member (
    member_id integer NOT NULL,
    username character varying(50) NOT NULL,
    email character varying(100) NOT NULL,
    password_hash character varying(255) NOT NULL,
    first_name character varying(50) NOT NULL,
    last_name character varying(50) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- TOC entry 220 (class 1259 OID 25146)
-- Name: member_member_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.member_member_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5089 (class 0 OID 0)
-- Dependencies: 220
-- Name: member_member_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.member_member_id_seq OWNED BY public.member.member_id;


--
-- TOC entry 221 (class 1259 OID 25147)
-- Name: member_role; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.member_role (
    member_id integer NOT NULL,
    role character varying(20) NOT NULL,
    CONSTRAINT member_role_role_check CHECK (((role)::text = ANY (ARRAY[('ADMIN'::character varying)::text, ('USER'::character varying)::text])))
);


--
-- TOC entry 222 (class 1259 OID 25153)
-- Name: product; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.product (
    product_id integer NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    price numeric(10,2) NOT NULL,
    category character varying(50),
    is_available boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- TOC entry 223 (class 1259 OID 25163)
-- Name: product_product_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.product_product_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5090 (class 0 OID 0)
-- Dependencies: 223
-- Name: product_product_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.product_product_id_seq OWNED BY public.product.product_id;


--
-- TOC entry 224 (class 1259 OID 25164)
-- Name: sale_order; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sale_order (
    order_id integer NOT NULL,
    member_id integer,
    order_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    total_amount numeric(10,2) NOT NULL,
    status character varying(20) NOT NULL,
    delivery_address text,
    CONSTRAINT sale_order_status_check CHECK (((status)::text = ANY (ARRAY[('COMPLETED'::character varying)::text, ('CANCELLED'::character varying)::text, ('PACKING'::character varying)::text])))
);


--
-- TOC entry 225 (class 1259 OID 25174)
-- Name: sale_order_item; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sale_order_item (
    order_item_id integer NOT NULL,
    order_id integer,
    product_id integer,
    quantity integer NOT NULL,
    unit_price numeric(10,2) NOT NULL,
    subtotal numeric(10,2) NOT NULL,
    CONSTRAINT sale_order_item_quantity_check CHECK ((quantity > 0))
);


--
-- TOC entry 226 (class 1259 OID 25182)
-- Name: sale_order_item_order_item_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.sale_order_item_order_item_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5091 (class 0 OID 0)
-- Dependencies: 226
-- Name: sale_order_item_order_item_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.sale_order_item_order_item_id_seq OWNED BY public.sale_order_item.order_item_id;


--
-- TOC entry 227 (class 1259 OID 25183)
-- Name: sale_order_order_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.sale_order_order_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5092 (class 0 OID 0)
-- Dependencies: 227
-- Name: sale_order_order_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.sale_order_order_id_seq OWNED BY public.sale_order.order_id;


--
-- TOC entry 4903 (class 2604 OID 25240)
-- Name: dining_feedback feedback_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dining_feedback ALTER COLUMN feedback_id SET DEFAULT nextval('public.dining_feedback_feedback_id_seq'::regclass);


--
-- TOC entry 4904 (class 2604 OID 41890)
-- Name: feedback feedback_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.feedback ALTER COLUMN feedback_id SET DEFAULT nextval('public.feedback_feedback_id_seq'::regclass);


--
-- TOC entry 4895 (class 2604 OID 25184)
-- Name: member member_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.member ALTER COLUMN member_id SET DEFAULT nextval('public.member_member_id_seq'::regclass);


--
-- TOC entry 4897 (class 2604 OID 25185)
-- Name: product product_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product ALTER COLUMN product_id SET DEFAULT nextval('public.product_product_id_seq'::regclass);


--
-- TOC entry 4900 (class 2604 OID 25186)
-- Name: sale_order order_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sale_order ALTER COLUMN order_id SET DEFAULT nextval('public.sale_order_order_id_seq'::regclass);


--
-- TOC entry 4902 (class 2604 OID 25187)
-- Name: sale_order_item order_item_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sale_order_item ALTER COLUMN order_item_id SET DEFAULT nextval('public.sale_order_item_order_item_id_seq'::regclass);


--
-- TOC entry 4924 (class 2606 OID 25250)
-- Name: dining_feedback dining_feedback_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dining_feedback
    ADD CONSTRAINT dining_feedback_pkey PRIMARY KEY (feedback_id);


--
-- TOC entry 4926 (class 2606 OID 41898)
-- Name: feedback feedback_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.feedback
    ADD CONSTRAINT feedback_pkey PRIMARY KEY (feedback_id);


--
-- TOC entry 4910 (class 2606 OID 25189)
-- Name: member member_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.member
    ADD CONSTRAINT member_email_key UNIQUE (email);


--
-- TOC entry 4912 (class 2606 OID 25191)
-- Name: member member_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.member
    ADD CONSTRAINT member_pkey PRIMARY KEY (member_id);


--
-- TOC entry 4916 (class 2606 OID 25193)
-- Name: member_role member_role_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.member_role
    ADD CONSTRAINT member_role_pkey PRIMARY KEY (member_id, role);


--
-- TOC entry 4914 (class 2606 OID 25195)
-- Name: member member_username_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.member
    ADD CONSTRAINT member_username_key UNIQUE (username);


--
-- TOC entry 4918 (class 2606 OID 25197)
-- Name: product product_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product
    ADD CONSTRAINT product_pkey PRIMARY KEY (product_id);


--
-- TOC entry 4922 (class 2606 OID 25199)
-- Name: sale_order_item sale_order_item_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sale_order_item
    ADD CONSTRAINT sale_order_item_pkey PRIMARY KEY (order_item_id);


--
-- TOC entry 4920 (class 2606 OID 25201)
-- Name: sale_order sale_order_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sale_order
    ADD CONSTRAINT sale_order_pkey PRIMARY KEY (order_id);


--
-- TOC entry 4931 (class 2606 OID 25256)
-- Name: dining_feedback dining_feedback_member_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dining_feedback
    ADD CONSTRAINT dining_feedback_member_id_fkey FOREIGN KEY (member_id) REFERENCES public.member(member_id) ON DELETE CASCADE;


--
-- TOC entry 4932 (class 2606 OID 25251)
-- Name: dining_feedback dining_feedback_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dining_feedback
    ADD CONSTRAINT dining_feedback_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.product(product_id) ON DELETE CASCADE;


--
-- TOC entry 4933 (class 2606 OID 41899)
-- Name: feedback feedback_dining_feedback_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.feedback
    ADD CONSTRAINT feedback_dining_feedback_id_fkey FOREIGN KEY (dining_feedback_id) REFERENCES public.dining_feedback(feedback_id) ON DELETE CASCADE;


--
-- TOC entry 4934 (class 2606 OID 41904)
-- Name: feedback feedback_member_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.feedback
    ADD CONSTRAINT feedback_member_id_fkey FOREIGN KEY (member_id) REFERENCES public.member(member_id) ON DELETE CASCADE;


--
-- TOC entry 4927 (class 2606 OID 25202)
-- Name: member_role member_role_member_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.member_role
    ADD CONSTRAINT member_role_member_id_fkey FOREIGN KEY (member_id) REFERENCES public.member(member_id);


--
-- TOC entry 4929 (class 2606 OID 25207)
-- Name: sale_order_item sale_order_item_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sale_order_item
    ADD CONSTRAINT sale_order_item_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.sale_order(order_id);


--
-- TOC entry 4930 (class 2606 OID 25212)
-- Name: sale_order_item sale_order_item_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sale_order_item
    ADD CONSTRAINT sale_order_item_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.product(product_id);


--
-- TOC entry 4928 (class 2606 OID 25217)
-- Name: sale_order sale_order_member_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sale_order
    ADD CONSTRAINT sale_order_member_id_fkey FOREIGN KEY (member_id) REFERENCES public.member(member_id);


-- Completed on 2026-06-29 15:56:14

--
-- PostgreSQL database dump complete
--

\unrestrict 5fKPD8jDxIhe6PS6a43NgUJ5lvdXZsc3OBd2DuhAMXIkJ3xG6CwBy4r2vSx9XHY

